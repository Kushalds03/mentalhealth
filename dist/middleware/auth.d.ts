import { Request, Response, NextFunction } from 'express';
export interface AuthRequest extends Request {
    user?: any;
    userType?: 'user' | 'therapist' | 'admin';
}
export declare const authMiddleware: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const requireUser: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const requireTherapist: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const requireAdmin: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const requireRole: (roles: ("user" | "therapist" | "admin")[]) => (req: AuthRequest, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.d.ts.map