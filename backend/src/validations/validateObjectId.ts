import { param, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import createError from 'http-errors';

export const validateObjectIdParam = (paramName: string) => [
  param(paramName).isMongoId().withMessage(`Invalid ${paramName}`),
  (req: Request, _res: Response, next: NextFunction) => {
    const errs = validationResult(req);
    if (!errs.isEmpty()) {
      return next(
        createError(400, `Invalid parameter: ${errs.array()[0].msg}`, {
          errors: errs.array(),
        }),
      );
    }
    next();
  },
];
