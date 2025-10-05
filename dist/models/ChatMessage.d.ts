import mongoose, { Document } from 'mongoose';
export interface IChatMessage extends Document {
    user: mongoose.Types.ObjectId;
    sessionId: string;
    message: string;
    response: string;
    messageType: 'user' | 'ai' | 'system';
    intent?: string;
    confidence?: number;
    mood?: 'positive' | 'negative' | 'neutral' | 'anxious' | 'depressed';
    escalationLevel: number;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IChatMessage, {}, {}, {}, mongoose.Document<unknown, {}, IChatMessage, {}> & IChatMessage & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=ChatMessage.d.ts.map