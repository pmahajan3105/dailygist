import { Request, Response, NextFunction } from 'express';
import {AuthService} from "../../services/auth/service";
import logger from "../../util/logger";

export const authMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        // console.log(req.headers.authorization);
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({
                message: 'No token provided'
            });
        }

        const authService = new AuthService();
        const user = await authService.validateToken(token);

        req.user = { id: user.id, email: user.email };
        next();
    }
    catch (error) {
        logger.error('Authentication middleware error', { error });
        res.status(401).json({
            message: 'Unauthorized'
        });
    }
};