"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const mongoose_1 = __importDefault(require("mongoose"));
const path_1 = __importDefault(require("path"));
const auth_1 = __importDefault(require("./routes/auth"));
const user_1 = __importDefault(require("./routes/user"));
const therapist_1 = __importDefault(require("./routes/therapist"));
const admin_1 = __importDefault(require("./routes/admin"));
const appointment_1 = __importDefault(require("./routes/appointment"));
const chatbot_1 = __importDefault(require("./routes/chatbot"));
const notification_1 = __importDefault(require("./routes/notification"));
const errorHandler_1 = require("./middleware/errorHandler");
const auth_2 = require("./middleware/auth");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 1000
});
app.use(limiter);
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
mongoose_1.default.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mental-wellness')
    .then(() => {
    console.log('Connected to MongoDB');
})
    .catch((error) => {
    console.error('MongoDB connection error:', error);
});
app.use('/api/auth', auth_1.default);
app.use('/api/user', auth_2.authMiddleware, user_1.default);
app.use('/api/therapist', auth_2.authMiddleware, therapist_1.default);
app.use('/api/admin', auth_2.authMiddleware, admin_1.default);
app.use('/api/appointments', auth_2.authMiddleware, appointment_1.default);
app.use('/api/chatbot', auth_2.authMiddleware, chatbot_1.default);
app.use('/api/notifications', auth_2.authMiddleware, notification_1.default);
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Mental Wellness API is running' });
});
app.use(errorHandler_1.errorHandler);
app.use('*', (req, res) => {
    res.status(404).json({ message: 'Route not found' });
});
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
exports.default = app;
//# sourceMappingURL=index.js.map