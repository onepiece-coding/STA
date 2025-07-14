import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import createError from 'http-errors';
import User, { IUser } from '../models/User.js';

interface JwtPayload { id: string; role: string; }

export async function authenticateUser(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization?.split(' ');
  if (!authHeader || authHeader[0] !== 'Bearer') {
    return next(createError(401, 'No token provided'));
  }
  try {
    const payload = jwt.verify(authHeader[1], process.env.JWT_SECRET!) as JwtPayload;
    const user = await User.findById(payload.id).select("-password");
    if(!user) return next(createError(404, "User not found"));
    req.user = user;
    next();
  } catch (err) {
    return next(createError(401, 'Invalid token'));
  }
}

export function authorizeRoles(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userRole = req.user?.role;
    if (!roles.includes(userRole as string)) {
      res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action."
      });
      return;
    }
    next();
  };
}