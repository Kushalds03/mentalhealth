"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const Admin_1 = __importDefault(require("../models/Admin"));
dotenv_1.default.config();
function parseArgs() {
    const args = process.argv.slice(2);
    const result = {};
    for (let i = 0; i < args.length; i++) {
        if (args[i].startsWith('--')) {
            const key = args[i].replace(/^--/, '');
            const value = args[i + 1];
            if (value && !value.startsWith('--')) {
                result[key] = value;
                i++;
            }
            else {
                result[key] = 'true';
            }
        }
    }
    return result;
}
async function main() {
    try {
        const { email, password } = parseArgs();
        if (!email || !password) {
            console.error('Usage: ts-node -r dotenv/config src/scripts/resetAdminPassword.ts --email <email> --password <newPassword>');
            process.exit(1);
        }
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mental-wellness';
        await mongoose_1.default.connect(mongoUri);
        let admin = await Admin_1.default.findOne({ email });
        if (!admin) {
            admin = new Admin_1.default({
                email,
                password,
                firstName: 'Admin',
                lastName: 'User',
                role: 'admin',
                permissions: ['manage_users', 'manage_therapists', 'view_analytics', 'manage_appointments'],
                isActive: true
            });
            await admin.save();
            console.log('Admin created and password set for', email);
        }
        else {
            admin.password = password;
            await admin.save();
            console.log('Admin password updated for', email);
        }
        await mongoose_1.default.disconnect();
        process.exit(0);
    }
    catch (err) {
        console.error('Error resetting admin password:', err);
        try {
            await mongoose_1.default.disconnect();
        }
        catch (_a) { }
        process.exit(3);
    }
}
main();
//# sourceMappingURL=resetAdminPassword.js.map