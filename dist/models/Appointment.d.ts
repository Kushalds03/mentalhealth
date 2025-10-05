import mongoose, { Document } from 'mongoose';
export interface IAppointment extends Document {
    user: mongoose.Types.ObjectId;
    therapist: mongoose.Types.ObjectId;
    date: Date;
    startTime: string;
    endTime: string;
    duration: number;
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no-show';
    sessionType: 'individual' | 'group' | 'couple';
    sessionMode: 'video' | 'audio' | 'chat' | 'in-person';
    notes?: string;
    cancellationReason?: string;
    rating?: number;
    review?: string;
    paymentStatus: 'pending' | 'paid' | 'refunded';
    amount: number;
    meetingLink?: string;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IAppointment, {}, {}, {}, mongoose.Document<unknown, {}, IAppointment, {}> & IAppointment & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Appointment.d.ts.map