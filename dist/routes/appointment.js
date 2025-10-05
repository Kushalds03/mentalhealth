"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const Appointment_1 = __importDefault(require("../models/Appointment"));
const Therapist_1 = __importDefault(require("../models/Therapist"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.post('/book', [
    auth_1.requireUser,
    (0, express_validator_1.body)('therapistId').isMongoId(),
    (0, express_validator_1.body)('date').isISO8601(),
    (0, express_validator_1.body)('startTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    (0, express_validator_1.body)('duration').isInt({ min: 30, max: 180 }),
    (0, express_validator_1.body)('sessionType').isIn(['individual', 'group', 'couple']),
    (0, express_validator_1.body)('sessionMode').isIn(['video', 'audio', 'chat', 'in-person']),
    (0, express_validator_1.body)('notes').optional().trim().isLength({ max: 1000 })
], async (req, res, next) => {
    var _a;
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { therapistId, date, startTime, duration, sessionType, sessionMode, notes } = req.body;
        const therapist = await Therapist_1.default.findById(therapistId);
        if (!therapist || !therapist.isActive || !therapist.isVerified) {
            return res.status(404).json({ message: 'Therapist not found or unavailable' });
        }
        const startTimeMinutes = parseInt(startTime.split(':')[0]) * 60 + parseInt(startTime.split(':')[1]);
        const endTimeMinutes = startTimeMinutes + duration;
        const endTime = `${Math.floor(endTimeMinutes / 60).toString().padStart(2, '0')}:${(endTimeMinutes % 60).toString().padStart(2, '0')}`;
        const conflictingAppointment = await Appointment_1.default.findOne({
            therapist: therapistId,
            date: new Date(date),
            status: { $in: ['pending', 'confirmed'] },
            $or: [
                {
                    startTime: { $lt: endTime },
                    endTime: { $gt: startTime }
                }
            ]
        });
        if (conflictingAppointment) {
            return res.status(400).json({ message: 'Time slot is not available' });
        }
        const amount = (therapist.hourlyRate / 60) * duration;
        const appointment = new Appointment_1.default({
            user: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id,
            therapist: therapistId,
            date: new Date(date),
            startTime,
            endTime,
            duration,
            sessionType,
            sessionMode,
            notes,
            amount
        });
        await appointment.save();
        await appointment.populate('therapist', 'firstName lastName specializations rating');
        res.status(201).json({
            message: 'Appointment booked successfully',
            appointment
        });
    }
    catch (error) {
        return next(error);
    }
});
router.get('/therapist', auth_1.requireTherapist, async (req, res, next) => {
    var _a;
    try {
        const { status, date, page = 1, limit = 10 } = req.query;
        const filter = { therapist: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id };
        if (status) {
            filter.status = status;
        }
        if (date) {
            filter.date = new Date(date);
        }
        const appointments = await Appointment_1.default.find(filter)
            .populate('user', 'firstName lastName email')
            .sort({ date: 1, startTime: 1 })
            .limit(parseInt(limit) * 1)
            .skip((parseInt(page) - 1) * parseInt(limit));
        const total = await Appointment_1.default.countDocuments(filter);
        return res.json({
            appointments,
            totalPages: Math.ceil(total / parseInt(limit)),
            currentPage: parseInt(page),
            total
        });
    }
    catch (error) {
        return next(error);
    }
});
router.put('/:id/status', [
    auth_1.requireTherapist,
    (0, express_validator_1.body)('status').isIn(['confirmed', 'cancelled', 'completed', 'no-show'])
], async (req, res, next) => {
    var _a;
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { status } = req.body;
        const appointment = await Appointment_1.default.findOneAndUpdate({
            _id: req.params.id,
            therapist: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id
        }, { status }, { new: true }).populate('user', 'firstName lastName email');
        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }
        return res.json({ appointment });
    }
    catch (error) {
        return next(error);
    }
});
router.put('/:id/cancel', auth_1.requireUser, async (req, res, next) => {
    var _a;
    try {
        const appointment = await Appointment_1.default.findOneAndUpdate({
            _id: req.params.id,
            user: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id,
            status: { $in: ['pending', 'confirmed'] }
        }, { status: 'cancelled' }, { new: true }).populate('therapist', 'firstName lastName');
        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found or cannot be cancelled' });
        }
        return res.json({ appointment });
    }
    catch (error) {
        return next(error);
    }
});
router.get('/available-slots/:therapistId', auth_1.requireUser, async (req, res, next) => {
    try {
        const { date } = req.query;
        const { therapistId } = req.params;
        if (!date) {
            return res.status(400).json({ message: 'Date is required' });
        }
        const selectedDate = new Date(date);
        const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
        const therapist = await Therapist_1.default.findById(therapistId);
        if (!therapist) {
            return res.status(404).json({ message: 'Therapist not found' });
        }
        const bookedSlots = await Appointment_1.default.find({
            therapist: therapistId,
            date: selectedDate,
            status: { $in: ['confirmed', 'pending'] }
        }).select('startTime endTime');
        const bookedTimeSlots = bookedSlots.map(slot => slot.startTime);
        const availableSlots = [];
        for (let hour = 9; hour < 18; hour++) {
            const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
            if (!bookedTimeSlots.includes(timeSlot)) {
                availableSlots.push({
                    startTime: timeSlot,
                    endTime: `${(hour + 1).toString().padStart(2, '0')}:00`
                });
            }
        }
        return res.json({ availableSlots });
    }
    catch (error) {
        return next(error);
    }
});
exports.default = router;
//# sourceMappingURL=appointment.js.map