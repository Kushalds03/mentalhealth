"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Notification_1 = __importDefault(require("../models/Notification"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.get('/', auth_1.authMiddleware, async (req, res) => {
    var _a, _b;
    try {
        const notifications = await Notification_1.default.find({ recipient: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id })
            .sort({ createdAt: -1 })
            .limit(50);
        const unreadCount = await Notification_1.default.countDocuments({ recipient: (_b = req.user) === null || _b === void 0 ? void 0 : _b._id, read: false });
        return res.json({ notifications, unreadCount });
    }
    catch (error) {
        return res.status(500).json({ message: 'Error fetching notifications' });
    }
});
router.post('/:id/read', auth_1.authMiddleware, async (req, res) => {
    var _a;
    try {
        const notification = await Notification_1.default.findOneAndUpdate({ _id: req.params.id, recipient: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id }, { read: true }, { new: true });
        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }
        return res.json(notification);
    }
    catch (error) {
        return res.status(500).json({ message: 'Error updating notification' });
    }
});
exports.default = router;
//# sourceMappingURL=notification.js.map