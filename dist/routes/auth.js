"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const express_validator_1 = require("express-validator");
const User_1 = __importDefault(require("../models/User"));
const Therapist_1 = __importDefault(require("../models/Therapist"));
const Admin_1 = __importDefault(require("../models/Admin"));
const router = express_1.default.Router();
const generateToken = (userId, userType) => {
    return jsonwebtoken_1.default.sign({ userId, userType }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '7d' });
};
router.post('/register/user', [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
    (0, express_validator_1.body)('password').isLength({ min: 6 }),
    (0, express_validator_1.body)('firstName').trim().isLength({ min: 2, max: 50 }),
    (0, express_validator_1.body)('lastName').trim().isLength({ min: 2, max: 50 }),
    (0, express_validator_1.body)('phone').optional().isMobilePhone('any'),
    (0, express_validator_1.body)('dateOfBirth').optional().isISO8601(),
    (0, express_validator_1.body)('gender').optional().isIn(['male', 'female', 'other', 'prefer-not-to-say'])
], async (req, res, next) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { email, password, firstName, lastName, phone, dateOfBirth, gender } = req.body;
        let user = await User_1.default.findOne({ email }).exec();
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }
        user = new User_1.default({
            email,
            password,
            firstName,
            lastName,
            phone,
            dateOfBirth,
            gender
        });
        await user.save();
        const token = generateToken(user._id.toString(), 'user');
        return res.status(201).json({
            token,
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                userType: 'user'
            }
        });
    }
    catch (error) {
        return next(error);
    }
});
router.post('/register/therapist', [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
    (0, express_validator_1.body)('password').isLength({ min: 6 }),
    (0, express_validator_1.body)('firstName').trim().isLength({ min: 2, max: 50 }),
    (0, express_validator_1.body)('lastName').trim().isLength({ min: 2, max: 50 }),
    (0, express_validator_1.body)('licenseNumber').trim().notEmpty(),
    (0, express_validator_1.body)('specializations').isArray({ min: 1 }),
    (0, express_validator_1.body)('education').isArray({ min: 1 }),
    (0, express_validator_1.body)('education.*.degree').notEmpty().withMessage('Degree is required'),
    (0, express_validator_1.body)('education.*.institution').notEmpty().withMessage('Institution is required'),
    (0, express_validator_1.body)('education.*.year').isNumeric().withMessage('Year must be a number'),
    (0, express_validator_1.body)('experience').isInt({ min: 0 }),
    (0, express_validator_1.body)('bio').trim().isLength({ min: 50, max: 1000 }),
    (0, express_validator_1.body)('hourlyRate').isFloat({ min: 0 }),
    (0, express_validator_1.body)('languages').isArray({ min: 1 })
], async (req, res, next) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { email, password, firstName, lastName, licenseNumber, specializations, education, experience, bio, hourlyRate, languages } = req.body;
        const existingTherapist = await Therapist_1.default.findOne({
            $or: [{ email }, { licenseNumber }]
        });
        if (existingTherapist) {
            return res.status(400).json({ message: 'Therapist already exists with this email or license number' });
        }
        const therapist = new Therapist_1.default({
            email,
            password,
            firstName,
            lastName,
            licenseNumber,
            specializations,
            education,
            experience,
            bio,
            hourlyRate,
            languages
        });
        await therapist.save();
        const token = generateToken(therapist._id.toString(), 'therapist');
        return res.status(201).json({
            message: 'Therapist registered successfully',
            token,
            therapist: {
                id: therapist._id,
                email: therapist.email,
                firstName: therapist.firstName,
                lastName: therapist.lastName,
                userType: 'therapist'
            }
        });
    }
    catch (error) {
        return next(error);
    }
});
router.post('/register/admin', [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
    (0, express_validator_1.body)('password').isLength({ min: 6 }),
    (0, express_validator_1.body)('firstName').trim().isLength({ min: 2, max: 50 }),
    (0, express_validator_1.body)('lastName').trim().isLength({ min: 2, max: 50 }),
    (0, express_validator_1.body)('role').isIn(['admin', 'moderator']),
    (0, express_validator_1.body)('permissions').isArray()
], async (req, res, next) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { email, password, firstName, lastName, role, permissions } = req.body;
        const existingAdmin = await Admin_1.default.findOne({ email });
        if (existingAdmin) {
            return res.status(400).json({ message: 'Admin already exists with this email' });
        }
        const admin = new Admin_1.default({
            email,
            password,
            firstName,
            lastName,
            role,
            permissions
        });
        await admin.save();
        const token = generateToken(admin._id.toString(), 'admin');
        return res.json({
            token,
            admin: {
                id: admin._id,
                email: admin.email,
                firstName: admin.firstName,
                lastName: admin.lastName,
                userType: 'admin'
            }
        });
    }
    catch (error) {
        return next(error);
    }
});
router.post('/login', [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
    (0, express_validator_1.body)('password').notEmpty(),
    (0, express_validator_1.body)('userType').isIn(['user', 'therapist', 'admin'])
], async (req, res, next) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { email, password, userType } = req.body;
        let user;
        let Model;
        switch (userType) {
            case 'user':
                Model = User_1.default;
                break;
            case 'therapist':
                Model = Therapist_1.default;
                break;
            case 'admin':
                Model = Admin_1.default;
                break;
            default:
                return res.status(400).json({ message: 'Invalid user type' });
        }
        user = await Model.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        if (!user.isActive) {
            return res.status(401).json({ message: 'Account is deactivated' });
        }
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        user.lastLogin = new Date();
        await user.save();
        const token = generateToken(user._id.toString(), userType);
        const userForResponse = Object.assign(Object.assign({ id: user._id, email: user.email, firstName: user.firstName, lastName: user.lastName, userType: userType }, (userType === 'admin' && { role: user.role, permissions: user.permissions })), (userType === 'therapist' && { isVerified: user.isVerified, specializations: user.specializations }));
        return res.json({
            token,
            user: userForResponse
        });
    }
    catch (error) {
        return next(error);
    }
});
router.get('/me', async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authenticated' });
        }
        return res.json({
            user: req.user,
            userType: req.userType
        });
    }
    catch (error) {
        return next(error);
    }
});
router.post('/login/therapist', [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
    (0, express_validator_1.body)('password').exists()
], async (req, res, next) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { email, password } = req.body;
        const therapist = await Therapist_1.default.findOne({ email }).exec();
        if (!therapist) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        const isMatch = await therapist.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        const token = generateToken(therapist._id.toString(), 'therapist');
        return res.json({
            token,
            therapist: {
                id: therapist._id,
                email: therapist.email,
                firstName: therapist.firstName,
                lastName: therapist.lastName,
                userType: 'therapist'
            }
        });
    }
    catch (error) {
        return next(error);
    }
});
router.post('/login/admin', [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
    (0, express_validator_1.body)('password').exists()
], async (req, res, next) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { email, password } = req.body;
        const admin = await Admin_1.default.findOne({ email }).exec();
        if (!admin) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        const isMatch = await admin.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        const token = generateToken(admin._id.toString(), 'admin');
        return res.json({
            token,
            admin: {
                id: admin._id,
                email: admin.email,
                firstName: admin.firstName,
                lastName: admin.lastName,
                userType: 'admin'
            }
        });
    }
    catch (error) {
        return next(error);
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map