import { body, param, validationResult } from 'express-validator';
import createError from 'http-errors';
import { Request, Response, NextFunction } from 'express';

export const validateCreateCity = [
  body('name').isString().notEmpty().withMessage('City name is required'),
  (req: Request, _res: Response, next: NextFunction) => {
    const errs = validationResult(req);
    if (!errs.isEmpty()) {
      return next(
        createError(400, `Validation failed: ${errs.array()[0].msg}`, {
          errors: errs.array(),
        }),
      );
    }
    next();
  },
];

export const validateCreateSector = [
  body('name').isString().notEmpty().withMessage('Sector name is required'),
  body('city').isMongoId().withMessage('Valid city ID is required'),
  (req: Request, _res: Response, next: NextFunction) => {
    const errs = validationResult(req);
    if (!errs.isEmpty()) {
      return next(
        createError(400, `Validation failed: ${errs.array()[0].msg}`, {
          errors: errs.array(),
        }),
      );
    }
    next();
  },
];
