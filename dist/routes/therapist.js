"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const Therapist_1 = __importDefault(require("../models/Therapist"));
const Appointment_1 = __importDefault(require("../models/Appointment"));
const auth_1 = require("../middleware/auth");
const mongoose_1 = __importDefault(require("mongoose"));
const router = express_1.default.Router();
router.get('/profile', auth_1.requireTherapist, async (req, res, next) => {
    var _a;
    try {
        const therapist = await Therapist_1.default.findById((_a = req.user) === null || _a === void 0 ? void 0 : _a._id).select('-password');
        return res.json({ therapist });
    }
    catch (error) {
        return next(error);
    }
});
router.put('/profile', [
    auth_1.requireTherapist,
    (0, express_validator_1.body)('firstName').optional().trim().isLength({ min: 2, max: 50 }),
    (0, express_validator_1.body)('lastName').optional().trim().isLength({ min: 2, max: 50 }),
    (0, express_validator_1.body)('bio').optional().trim().isLength({ min: 50, max: 1000 }),
    (0, express_validator_1.body)('specializations').optional().isArray(),
    (0, express_validator_1.body)('hourlyRate').optional().isFloat({ min: 0 }),
    (0, express_validator_1.body)('languages').optional().isArray()
], async (req, res, next) => {
    var _a;
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const updates = req.body;
        const therapist = await Therapist_1.default.findByIdAndUpdate((_a = req.user) === null || _a === void 0 ? void 0 : _a._id, { $set: updates }, { new: true, runValidators: true }).select('-password');
        return res.json({ therapist });
    }
    catch (error) {
        return next(error);
    }
});
router.put('/availability', [
    auth_1.requireTherapist,
    (0, express_validator_1.body)('availability').isArray()
], async (req, res, next) => {
    var _a;
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { availability } = req.body;
        const therapist = await Therapist_1.default.findByIdAndUpdate((_a = req.user) === null || _a === void 0 ? void 0 : _a._id, { availability }, { new: true, runValidators: true }).select('-password');
        return res.json({ therapist });
    }
    catch (error) {
        return next(error);
    }
});
router.get('/appointments', auth_1.requireTherapist, async (req, res, next) => {
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
router.put('/appointments/:id/status', [
    auth_1.requireTherapist,
    (0, express_validator_1.body)('status').isIn(['confirmed', 'cancelled', 'completed', 'no-show']),
    (0, express_validator_1.body)('notes').optional().trim().isLength({ max: 1000 }),
    (0, express_validator_1.body)('cancellationReason').optional().trim().isLength({ max: 500 })
], async (req, res, next) => {
    var _a;
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { status, notes, cancellationReason } = req.body;
        const appointment = await Appointment_1.default.findOne({
            _id: req.params.id,
            therapist: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id
        });
        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }
        appointment.status = status;
        if (notes)
            appointment.notes = notes;
        if (cancellationReason)
            appointment.cancellationReason = cancellationReason;
        await appointment.save();
        return res.json({ message: 'Appointment status updated successfully', appointment });
    }
    catch (error) {
        return next(error);
    }
});
router.get('/dashboard', auth_1.requireTherapist, async (req, res, next) => {
    var _a, _b, _c, _d, _e;
    try {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        const [totalAppointments, pendingAppointments, completedThisMonth, totalEarnings] = await Promise.all([
            Appointment_1.default.countDocuments({ therapist: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id }),
            Appointment_1.default.countDocuments({ therapist: (_b = req.user) === null || _b === void 0 ? void 0 : _b._id, status: 'pending' }),
            Appointment_1.default.countDocuments({
                therapist: (_c = req.user) === null || _c === void 0 ? void 0 : _c._id,
                status: 'completed',
                date: { $gte: startOfMonth, $lte: endOfMonth }
            }),
            Appointment_1.default.aggregate([
                { $match: { therapist: (_d = req.user) === null || _d === void 0 ? void 0 : _d._id, status: 'completed' } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ])
        ]);
        return res.json({
            totalAppointments,
            pendingAppointments,
            completedThisMonth,
            totalEarnings: ((_e = totalEarnings[0]) === null || _e === void 0 ? void 0 : _e.total) || 0
        });
    }
    catch (error) {
        return next(error);
    }
});
router.get('/analytics', auth_1.requireTherapist, async (req, res, next) => {
    var _a, _b;
    try {
        const { period = 'month' } = req.query;
        const therapistId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        let startDate;
        const now = new Date();
        switch (period) {
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            case 'quarter':
                const quarter = Math.floor(now.getMonth() / 3);
                startDate = new Date(now.getFullYear(), quarter * 3, 1);
                break;
            case 'month':
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
        }
        const labelFormat = (d) => {
            const date = new Date(d);
            if (period === 'week' || period === 'month')
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            if (period === 'year' || period === 'quarter')
                return date.toLocaleDateString('en-US', { month: 'long' });
            return date.toLocaleDateString();
        };
        const appointmentsInRange = await Appointment_1.default.find({
            therapist: therapistId,
            date: { $gte: startDate },
        }).populate('user', 'firstName lastName');
        const earningsData = new Map();
        const appointmentsData = new Map();
        appointmentsInRange.forEach(app => {
            const key = labelFormat(new Date(app.date));
            if (app.status === 'completed') {
                earningsData.set(key, (earningsData.get(key) || 0) + app.amount);
            }
            appointmentsData.set(key, (appointmentsData.get(key) || 0) + 1);
        });
        const sortedEarnings = [...earningsData.entries()].sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime());
        const sortedAppointments = [...appointmentsData.entries()].sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime());
        const clientIds = [...new Set(appointmentsInRange
                .map(app => { var _a, _b; return (_b = (_a = app.user) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString(); })
                .filter(id => id))];
        const [newClientIds, averageRatingResult] = await Promise.all([
            clientIds.length > 0 ? Appointment_1.default.aggregate([
                { $match: { user: { $in: clientIds.map(id => new mongoose_1.default.Types.ObjectId(id)) } } },
                { $group: { _id: '$user', firstAppointment: { $min: '$date' } } },
                { $match: { firstAppointment: { $gte: startDate } } },
                { $project: { _id: 1 } }
            ]) : Promise.resolve([]),
            Appointment_1.default.aggregate([
                { $match: { therapist: therapistId, status: 'completed', rating: { $exists: true, $ne: null } } },
                { $group: { _id: null, avgRating: { $avg: '$rating' } } }
            ])
        ]);
        const newClientsCount = newClientIds.length;
        const sessionTypes = new Map();
        appointmentsInRange.forEach(app => {
            if (app.sessionType)
                sessionTypes.set(app.sessionType, (sessionTypes.get(app.sessionType) || 0) + 1);
        });
        let monthlyTrends = { labels: [], appointments: [], earnings: [] };
        if (period === 'year') {
            const monthlyData = await Appointment_1.default.aggregate([
                { $match: { therapist: therapistId, date: { $gte: startDate }, status: 'completed' } },
                {
                    $group: {
                        _id: { $month: '$date' },
                        totalAppointments: { $sum: 1 },
                        totalEarnings: { $sum: '$amount' }
                    }
                },
                { $sort: { '_id': 1 } }
            ]);
            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            monthlyTrends.labels = monthlyData.map(d => monthNames[d._id - 1]);
            monthlyTrends.appointments = monthlyData.map(d => d.totalAppointments);
            monthlyTrends.earnings = monthlyData.map(d => d.totalEarnings);
        }
        res.json({
            earnings: {
                labels: sortedEarnings.map(e => e[0]),
                data: sortedEarnings.map(e => e[1])
            },
            appointments: {
                labels: sortedAppointments.map(a => a[0]),
                data: sortedAppointments.map(a => a[1])
            },
            clientStats: {
                totalClients: clientIds.length,
                newClients: newClientsCount,
                returningClients: clientIds.length - newClientsCount,
                averageRating: ((_b = averageRatingResult[0]) === null || _b === void 0 ? void 0 : _b.avgRating) || 0
            },
            sessionTypes: {
                labels: [...sessionTypes.keys()],
                data: [...sessionTypes.values()]
            },
            monthlyTrends: monthlyTrends,
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/reviews', auth_1.requireTherapist, async (req, res, next) => {
    var _a;
    try {
        const reviews = await Appointment_1.default.find({
            therapist: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id,
            status: 'completed',
            rating: { $exists: true, $ne: null }
        })
            .select('user rating review date')
            .populate('user', 'firstName lastName');
        res.json({ reviews });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=therapist.js.map