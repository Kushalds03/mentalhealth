"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const Admin_1 = __importDefault(require("./models/Admin"));
const seedDatabase = async () => {
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
        console.error('Error: MONGODB_URI is not defined. Please create a .env file in the /backend directory with your MongoDB connection string.');
        process.exit(1);
    }
    try {
        await mongoose_1.default.connect(MONGODB_URI);
        console.log('Connected to MongoDB for seeding.');
        const adminDetails = {
            email: 'gopal@gmail.com',
            password: 'gopal@123',
            firstName: 'gopal',
            lastName: 'Krishna',
            role: 'admin',
            permissions: [
                'manage_users',
                'manage_therapists',
                'manage_admins',
                'view_analytics',
                'manage_content',
                'manage_appointments',
                'view_chat_logs'
            ]
        };
        const adminExists = await Admin_1.default.findOne({ email: adminDetails.email });
        if (adminExists) {
            await Admin_1.default.deleteOne({ email: adminDetails.email });
            console.log(`Removed existing admin: ${adminDetails.email}`);
        }
        const admin = new Admin_1.default(adminDetails);
        await admin.save();
        console.log('Admin user seeded successfully!');
        console.log(`Email: ${adminDetails.email}`);
        console.log(`Password: ${adminDetails.password}`);
    }
    catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
    finally {
        await mongoose_1.default.disconnect();
        console.log('Disconnected from MongoDB.');
    }
};
seedDatabase();
//# sourceMappingURL=seed.js.map