import mongoose, { Document } from 'mongoose';
export interface ITherapist extends Document {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    licenseNumber: string;
    specializations: string[];
    education: {
        degree: string;
        institution: string;
        year: number;
    }[];
    experience: number;
    bio: string;
    hourlyRate: number;
    availability: {
        day: string;
        startTime: string;
        endTime: string;
        isAvailable: boolean;
    }[];
    languages: string[];
    isActive: boolean;
    isVerified: boolean;
    rating: number;
    totalSessions: number;
    lastLogin?: Date;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}
declare const _default: mongoose.Model<ITherapist, {}, {}, {}, mongoose.Document<unknown, {}, ITherapist, {}> & ITherapist & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Therapist.d.ts.map