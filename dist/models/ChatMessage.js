"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const chatMessageSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sessionId: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true,
        maxlength: 2000
    },
    response: {
        type: String,
        required: false,
        maxlength: 2000
    },
    messageType: {
        type: String,
        enum: ['user', 'ai', 'system'],
        required: true
    },
    intent: {
        type: String,
        maxlength: 100
    },
    confidence: {
        type: Number,
        min: 0,
        max: 1
    },
    mood: {
        type: String,
        enum: ['positive', 'negative', 'neutral', 'anxious', 'depressed']
    },
    escalationLevel: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    tags: [{
            type: String,
            maxlength: 50
        }]
}, {
    timestamps: true
});
chatMessageSchema.index({ user: 1, sessionId: 1, createdAt: -1 });
chatMessageSchema.index({ escalationLevel: 1, createdAt: -1 });
exports.default = mongoose_1.default.model('ChatMessage', chatMessageSchema);
//# sourceMappingURL=ChatMessage.js.map