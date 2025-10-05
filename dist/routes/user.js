"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const User_1 = __importDefault(require("../models/User"));
const Therapist_1 = __importDefault(require("../models/Therapist"));
const Appointment_1 = __importDefault(require("../models/Appointment"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
const upload = (0, multer_1.default)({ storage: storage });
router.get('/profile', auth_1.requireUser, async (req, res, next) => {
    var _a;
    try {
        const user = await User_1.default.findById((_a = req.user) === null || _a === void 0 ? void 0 : _a._id).select('-password');
        res.json({ user });
    }
    catch (error) {
        next(error);
    }
});
router.put('/profile', upload.single('profileImage'), auth_1.requireUser, async (req, res, next) => {
    var _a;
    try {
        const updates = {};
        if (req.file) {
            updates.profileImage = req.file.path;
        }
        for (const key in req.body) {
            if (key === 'emergencyContact' || key === 'preferences') {
                updates[key] = JSON.parse(req.body[key]);
            }
            else {
                updates[key] = req.body[key];
            }
        }
        const user = await User_1.default.findByIdAndUpdate((_a = req.user) === null || _a === void 0 ? void 0 : _a._id, { $set: updates }, { new: true, runValidators: true }).select('-password');
        return res.json({ user });
    }
    catch (error) {
        return next(error);
    }
});
router.put('/change-password', [
    auth_1.requireUser,
    (0, express_validator_1.body)('currentPassword').notEmpty().withMessage('Current password is required'),
    (0, express_validator_1.body)('newPassword')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain uppercase, lowercase, and number'),
    (0, express_validator_1.body)('confirmPassword')
        .custom((value, { req }) => {
        if (value !== req.body.newPassword) {
            throw new Error('Passwords do not match');
        }
        return true;
    })
], async (req, res, next) => {
    var _a;
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { currentPassword, newPassword } = req.body;
        const user = await User_1.default.findById((_a = req.user) === null || _a === void 0 ? void 0 : _a._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const isPasswordValid = await bcryptjs_1.default.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }
        const saltRounds = 12;
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, saltRounds);
        user.password = hashedPassword;
        await user.save();
        return res.json({ message: 'Password changed successfully' });
    }
    catch (error) {
        return next(error);
    }
});
router.get('/therapists', auth_1.requireUser, async (req, res, next) => {
    try {
        const { search, specialization, language, minRating, maxPrice, availability, page = 1, limit = 10 } = req.query;
        const filter = { isActive: true, isVerified: true };
        const andConditions = [filter];
        if (search) {
            const searchRegex = new RegExp(search, 'i');
            andConditions.push({
                $or: [
                    { firstName: searchRegex },
                    { lastName: searchRegex },
                    { bio: searchRegex },
                ]
            });
        }
        if (specialization) {
            andConditions.push({ specializations: { $in: [specialization] } });
        }
        if (language) {
            andConditions.push({ languages: { $in: [language] } });
        }
        if (minRating) {
            andConditions.push({ rating: { $gte: parseFloat(minRating) } });
        }
        if (maxPrice) {
            andConditions.push({ hourlyRate: { $lte: parseFloat(maxPrice) } });
        }
        const finalFilter = { $and: andConditions };
        const therapists = await Therapist_1.default.find(finalFilter)
            .select('-password')
            .limit(parseInt(limit) * 1)
            .skip((parseInt(page) - 1) * parseInt(limit))
            .sort({ rating: -1, totalSessions: -1 });
        const total = await Therapist_1.default.countDocuments(finalFilter);
        return res.json({
            therapists,
            totalPages: Math.ceil(total / parseInt(limit)),
            currentPage: parseInt(page),
            total
        });
    }
    catch (error) {
        return next(error);
    }
});
router.get('/therapists/:id', auth_1.requireUser, async (req, res, next) => {
    try {
        const therapist = await Therapist_1.default.findById(req.params.id)
            .select('-password')
            .populate('reviews');
        if (!therapist) {
            return res.status(404).json({ message: 'Therapist not found' });
        }
        return res.json({ therapist });
    }
    catch (error) {
        return next(error);
    }
});
router.get('/appointments', auth_1.requireUser, async (req, res, next) => {
    var _a;
    try {
        const { status, page = 1, limit = 10 } = req.query;
        const filter = { user: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id };
        if (status) {
            filter.status = status;
        }
        const appointments = await Appointment_1.default.find(filter)
            .populate('therapist', 'firstName lastName specializations rating')
            .sort({ date: -1 })
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
router.get('/appointments/:id', auth_1.requireUser, async (req, res, next) => {
    var _a;
    try {
        const appointment = await Appointment_1.default.findOne({
            _id: req.params.id,
            user: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id
        }).populate('therapist', 'firstName lastName specializations');
        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }
        return res.json({ appointment });
    }
    catch (error) {
        return next(error);
    }
});
router.post('/appointments/:id/review', [
    auth_1.requireUser,
    (0, express_validator_1.body)('rating').isInt({ min: 1, max: 5 }),
    (0, express_validator_1.body)('review').optional().trim().isLength({ max: 1000 })
], async (req, res, next) => {
    var _a;
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { rating, review } = req.body;
        const appointment = await Appointment_1.default.findOne({
            _id: req.params.id,
            user: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id,
            status: 'completed'
        });
        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found or not completed' });
        }
        appointment.rating = rating;
        appointment.review = review;
        await appointment.save();
        const therapistId = appointment.therapist;
        const completedAppointments = await Appointment_1.default.find({
            therapist: therapistId,
            status: 'completed',
            rating: { $exists: true, $ne: null }
        });
        const avgRating = completedAppointments.length
            ? completedAppointments.reduce((sum, a) => sum + (typeof a.rating === 'number' ? a.rating : 0), 0) / completedAppointments.length
            : 0;
        await Therapist_1.default.findByIdAndUpdate(therapistId, { rating: avgRating });
        return res.json({ message: 'Review submitted successfully', appointment });
    }
    catch (error) {
        return next(error);
    }
});
router.post('/book-appointment', [
    auth_1.requireUser,
    (0, express_validator_1.body)('therapistId').isMongoId(),
    (0, express_validator_1.body)('date').isISO8601(),
    (0, express_validator_1.body)('startTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    (0, express_validator_1.body)('duration').isInt({ min: 30, max: 180 }),
    (0, express_validator_1.body)('sessionType').isIn(['individual', 'couple', 'group']),
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
        return res.status(201).json({
            message: 'Appointment booked successfully',
            appointment
        });
    }
    catch (error) {
        return next(error);
    }
});
exports.default = router;
//# sourceMappingURL=user.js.map