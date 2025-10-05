import mongoose, { Document } from 'mongoose';
export interface INotification extends Document {
    recipient: mongoose.Types.ObjectId;
    recipientModel: 'User' | 'Therapist' | 'Admin';
    sender?: mongoose.Types.ObjectId;
    senderModel?: 'User' | 'Therapist' | 'System';
    type: 'new_user' | 'new_therapist' | 'appointment_booked' | 'appointment_cancelled' | 'review_left' | 'therapist_verified';
    message: string;
    link?: string;
    read: boolean;
    createdAt: Date;
}
declare const _default: mongoose.Model<INotification, {}, {}, {}, mongoose.Document<unknown, {}, INotification, {}> & INotification & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Notification.d.ts.map