import mongoose, { Document } from 'mongoose';
export interface IAdmin extends Document {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: 'super-admin' | 'admin' | 'moderator';
    permissions: string[];
    isActive: boolean;
    lastLogin?: Date;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}
declare const _default: mongoose.Model<IAdmin, {}, {}, {}, mongoose.Document<unknown, {}, IAdmin, {}> & IAdmin & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Admin.d.ts.map