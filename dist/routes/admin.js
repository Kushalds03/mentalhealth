"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const User_1 = __importDefault(require("../models/User"));
const Therapist_1 = __importDefault(require("../models/Therapist"));
const Appointment_1 = __importDefault(require("../models/Appointment"));
const ChatMessage_1 = __importDefault(require("../models/ChatMessage"));
const Admin_1 = __importDefault(require("../models/Admin"));
const auth_1 = require("../middleware/auth");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const router = express_1.default.Router();
router.get('/users', auth_1.requireAdmin, async (req, res, next) => {
    try {
        const { page = 1, limit = 10, search, status } = req.query;
        const filter = {};
        if (search) {
            filter.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }
        if (status) {
            filter.isActive = status === 'active';
        }
        const users = await User_1.default.find(filter)
            .select('-password')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit) * 1)
            .skip((parseInt(page) - 1) * parseInt(limit));
        const total = await User_1.default.countDocuments(filter);
        res.json({
            users,
            totalPages: Math.ceil(total / parseInt(limit)),
            currentPage: parseInt(page),
            total
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/therapists', auth_1.requireAdmin, async (req, res, next) => {
    try {
        const { page = 1, limit = 10, search, status, verified } = req.query;
        const filter = {};
        if (search) {
            filter.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { licenseNumber: { $regex: search, $options: 'i' } }
            ];
        }
        if (status) {
            filter.isActive = status === 'active';
        }
        if (verified) {
            filter.isVerified = verified === 'verified';
        }
        const therapists = await Therapist_1.default.find(filter)
            .select('-password')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit) * 1)
            .skip((parseInt(page) - 1) * parseInt(limit));
        const total = await Therapist_1.default.countDocuments(filter);
        res.json({
            therapists,
            totalPages: Math.ceil(total / parseInt(limit)),
            currentPage: parseInt(page),
            total
        });
    }
    catch (error) {
        next(error);
    }
});
router.put('/therapists/:id/verify', auth_1.requireAdmin, async (req, res, next) => {
    try {
        const therapist = await Therapist_1.default.findByIdAndUpdate(req.params.id, { isVerified: true }, { new: true }).select('-password');
        if (!therapist) {
            return res.status(404).json({ message: 'Therapist not found' });
        }
        return res.json({ therapist });
    }
    catch (error) {
        return next(error);
    }
});
router.put('/users/:id/toggle-status', auth_1.requireAdmin, async (req, res, next) => {
    try {
        const { userType } = req.query;
        let Model;
        let user;
        if (userType === 'user') {
            Model = User_1.default;
        }
        else if (userType === 'therapist') {
            Model = Therapist_1.default;
        }
        else {
            return res.status(400).json({ message: 'Invalid user type' });
        }
        const doc = await Model.findById(req.params.id);
        if (!doc) {
            return res.status(404).json({ message: 'User not found' });
        }
        user = await Model.findByIdAndUpdate(req.params.id, { $set: { isActive: !doc.isActive } }, { new: true }).select('-password');
        return res.json({ user });
    }
    catch (error) {
        return next(error);
    }
});
router.put('/users/:id', auth_1.requireAdmin, async (req, res, next) => {
    try {
        const updates = Object.assign({}, req.body);
        delete updates.password;
        const user = await User_1.default.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true, runValidators: true }).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        return res.json({ user });
    }
    catch (error) {
        return next(error);
    }
});
router.put('/therapists/:id', auth_1.requireAdmin, async (req, res, next) => {
    try {
        const updates = Object.assign({}, req.body);
        delete updates.password;
        const therapist = await Therapist_1.default.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true, runValidators: true }).select('-password');
        if (!therapist) {
            return res.status(404).json({ message: 'Therapist not found' });
        }
        return res.json({ therapist });
    }
    catch (error) {
        return next(error);
    }
});
router.delete('/users/:id', auth_1.requireAdmin, async (req, res, next) => {
    try {
        const result = await User_1.default.deleteOne({ _id: req.params.id });
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        return res.json({ message: 'User deleted' });
    }
    catch (error) {
        return next(error);
    }
});
router.delete('/therapists/:id', auth_1.requireAdmin, async (req, res, next) => {
    try {
        const result = await Therapist_1.default.deleteOne({ _id: req.params.id });
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Therapist not found' });
        }
        return res.json({ message: 'Therapist deleted' });
    }
    catch (error) {
        return next(error);
    }
});
router.put('/change-password', auth_1.requireAdmin, async (req, res, next) => {
    var _a;
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Please provide current and new passwords.' });
    }
    try {
        const admin = await Admin_1.default.findById((_a = req.user) === null || _a === void 0 ? void 0 : _a._id);
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found.' });
        }
        const isMatch = await bcryptjs_1.default.compare(currentPassword, admin.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Incorrect current password.' });
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        admin.password = await bcryptjs_1.default.hash(newPassword, salt);
        await admin.save();
        return res.json({ message: 'Password updated successfully.' });
    }
    catch (error) {
        return next(error);
    }
});
router.post('/reset-password', async (req, res) => {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
        return res.status(400).json({ message: 'Email and newPassword are required.' });
    }
    try {
        const hash = await bcryptjs_1.default.hash(newPassword, 12);
        const result = await Admin_1.default.updateOne({ email }, { password: hash });
        if (result.modifiedCount === 0) {
            return res.status(404).json({ message: 'Admin not found or password not changed.' });
        }
        return res.json({ message: 'Password updated successfully.' });
    }
    catch (error) {
        return res.status(500).json({ message: 'Error updating password.' });
    }
});
router.get('/analytics', auth_1.requireAdmin, async (req, res, next) => {
    try {
        const { period = 'month' } = req.query;
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
                startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
                break;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }
        const [platformStats, userGrowth, revenueAnalytics, therapistStats, appointmentStatus] = await Promise.all([
            getPlatformStats(startDate),
            getGrowthData(startDate, period),
            getRevenueData(startDate, period),
            getTherapistStats(),
            getAppointmentStatus(startDate),
        ]);
        res.json({
            platformStats,
            userGrowth,
            revenueAnalytics,
            therapistStats,
            appointmentStatus,
        });
    }
    catch (error) {
        next(error);
    }
});
async function getPlatformStats(startDate) {
    var _a;
    const [totalUsers, totalTherapists, totalAppointments, completedAppointments, totalRevenue, chatbotMessages] = await Promise.all([
        User_1.default.countDocuments(),
        Therapist_1.default.countDocuments(),
        Appointment_1.default.countDocuments({ createdAt: { $gte: startDate } }),
        Appointment_1.default.countDocuments({ status: 'completed', createdAt: { $gte: startDate } }),
        Appointment_1.default.aggregate([
            { $match: { status: 'completed', createdAt: { $gte: startDate } } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        ChatMessage_1.default.countDocuments({ createdAt: { $gte: startDate } })
    ]);
    return { totalUsers, totalTherapists, totalAppointments, completedAppointments, totalRevenue: ((_a = totalRevenue[0]) === null || _a === void 0 ? void 0 : _a.total) || 0, chatbotMessages };
}
async function getGrowthData(startDate, period) {
    const format = (period === 'week' || period === 'month') ? '%Y-%m-%d' : '%Y-%m';
    const users = await User_1.default.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: { $dateToString: { format, date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
    ]);
    const therapists = await Therapist_1.default.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: { $dateToString: { format, date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
    ]);
    const labels = [...new Set([...users.map(u => u._id), ...therapists.map(t => t._id)])].sort();
    const userData = labels.map(label => { var _a; return ((_a = users.find(u => u._id === label)) === null || _a === void 0 ? void 0 : _a.count) || 0; });
    const therapistData = labels.map(label => { var _a; return ((_a = therapists.find(t => t._id === label)) === null || _a === void 0 ? void 0 : _a.count) || 0; });
    return { labels, users: userData, therapists: therapistData };
}
async function getRevenueData(startDate, period) {
    const format = (period === 'week' || period === 'month') ? '%Y-%m-%d' : '%Y-%m';
    const revenue = await Appointment_1.default.aggregate([
        { $match: { status: 'completed', date: { $gte: startDate } } },
        { $group: { _id: { $dateToString: { format, date: '$date' } }, total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
    ]);
    return {
        labels: revenue.map(r => r._id),
        revenue: revenue.map(r => r.total),
        appointments: revenue.map(r => r.count),
    };
}
async function getTherapistStats() {
    const [verified, pending, active, inactive] = await Promise.all([
        Therapist_1.default.countDocuments({ isVerified: true }),
        Therapist_1.default.countDocuments({ isVerified: false }),
        Therapist_1.default.countDocuments({ isActive: true }),
        Therapist_1.default.countDocuments({ isActive: false }),
    ]);
    return { verified, pending, active, inactive };
}
async function getAppointmentStatus(startDate) {
    const statuses = await Appointment_1.default.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    return {
        labels: statuses.map(s => s._id),
        data: statuses.map(s => s.count),
    };
}
router.get('/chatbot-analytics', auth_1.requireAdmin, async (req, res, next) => {
    try {
        const { days = 30 } = req.query;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));
        const [totalMessages, escalationCount, moodDistribution, topIntents] = await Promise.all([
            ChatMessage_1.default.countDocuments({ createdAt: { $gte: startDate } }),
            ChatMessage_1.default.countDocuments({
                escalationLevel: { $gte: 4 },
                createdAt: { $gte: startDate }
            }),
            ChatMessage_1.default.aggregate([
                { $match: { createdAt: { $gte: startDate }, mood: { $exists: true } } },
                { $group: { _id: '$mood', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]),
            ChatMessage_1.default.aggregate([
                { $match: { createdAt: { $gte: startDate }, intent: { $exists: true } } },
                { $group: { _id: '$intent', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 }
            ])
        ]);
        res.json({
            totalMessages,
            escalationCount,
            moodDistribution,
            topIntents,
            period: `${days} days`
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=admin.js.map