import { param, validationResult } from 'express-validator';
import createError from 'http-errors';
import { Request, Response, NextFunction } from 'express';

export const validateObjectIdParam = (paramName: string) => [
  param(paramName).isMongoId().withMessage(`Invalid ${paramName}`),
  (req: Request, _res: Response, next: NextFunction) => {
    const errs = validationResult(req);
    if (!errs.isEmpty()) {
      return next(createError(400, 'Invalid parameter', { errors: errs.array() }));
    }
    next();
  }
];