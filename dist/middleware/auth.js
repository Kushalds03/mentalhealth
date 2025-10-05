"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.requireAdmin = exports.requireTherapist = exports.requireUser = exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const Therapist_1 = __importDefault(require("../models/Therapist"));
const Admin_1 = __importDefault(require("../models/Admin"));
const authMiddleware = async (req, res, next) => {
    var _a;
    console.log(`[AUTH] Middleware triggered for: ${req.method} ${req.originalUrl}`);
    try {
        const token = (_a = req.header('Authorization')) === null || _a === void 0 ? void 0 : _a.replace('Bearer ', '');
        if (!token) {
            console.log('[AUTH] No token provided.');
            res.status(401).json({ message: 'No token, authorization denied' });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        console.log(`[AUTH] Decoded Token: userId=${decoded.userId}, userType=${decoded.userType}`);
        if (!decoded.userId || !decoded.userType) {
            console.log('[AUTH] Token missing required data.');
            res.status(401).json({ message: 'Token is missing required data' });
            return;
        }
        let user;
        const { userId, userType } = decoded;
        switch (userType) {
            case 'user':
                user = await User_1.default.findById(userId).select('-password');
                break;
            case 'therapist':
                user = await Therapist_1.default.findById(userId).select('-password');
                break;
            case 'admin':
                user = await Admin_1.default.findById(userId).select('-password');
                break;
            default:
                res.status(401).json({ message: 'Invalid user type in token' });
                return;
        }
        if (!user) {
            console.log(`[AUTH] User not found in database. UserID: ${userId}, UserType: ${userType}`);
            res.status(401).json({ message: 'Token is not valid, user not found' });
            return;
        }
        console.log(`[AUTH] User authenticated successfully. Role: ${userType}`);
        req.user = user;
        req.userType = userType;
        next();
    }
    catch (error) {
        res.status(401).json({ message: 'Token is not valid' });
        return;
    }
};
exports.authMiddleware = authMiddleware;
const requireUser = (req, res, next) => {
    if (!req.user) {
        res.status(401).json({ message: 'Access denied' });
        return;
    }
    next();
};
exports.requireUser = requireUser;
const requireTherapist = (req, res, next) => {
    console.log(`[AUTH] requireTherapist check. User type is: ${req.userType}`);
    if (!req.user || req.userType !== 'therapist') {
        res.status(403).json({ message: 'Access denied. Therapist only.' });
        return;
    }
    next();
};
exports.requireTherapist = requireTherapist;
const requireAdmin = (req, res, next) => {
    console.log(`[AUTH] requireAdmin check. User type is: ${req.userType}`);
    if (!req.user || req.userType !== 'admin') {
        res.status(403).json({ message: 'Access denied. Admin only.' });
        return;
    }
    next();
};
exports.requireAdmin = requireAdmin;
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ message: 'Access denied' });
            return;
        }
        else if (!req.userType || !roles.includes(req.userType)) {
            res.status(403).json({ message: 'Access denied' });
            return;
        }
        next();
    };
};
exports.requireRole = requireRole;
//# sourceMappingURL=auth.js.map