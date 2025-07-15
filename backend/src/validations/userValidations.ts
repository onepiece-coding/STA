import { NextFunction, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import createError from 'http-errors';

export const validateLoginUser = [
  body('username').isString().notEmpty().withMessage('username is required'),
  body('password').isString().notEmpty().withMessage('username is required'),
  (req: Request, _res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(
        createError(400, `Validation failed: ${errors.array()[0].msg}`, {
          errors: errors.array(),
        }),
      );
    }
    next();
  },
];

export const validateCreateSeller = [
  body('username').isString().notEmpty(),
  body('password').isString().isLength({ min: 6 }),
  body('sectors')
    .isArray({ min: 1 })
    .withMessage('At least one sector is required'),
  body('sectors.*').isMongoId(),
  (req: Request, _res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(
        createError(400, `Validation failed: ${errors.array()[0].msg}`, {
          errors: errors.array(),
        }),
      );
    }
    next();
  },
];

export const validateCreateDelivery = [
  body('username').isString().notEmpty(),
  body('password').isString().isLength({ min: 6 }),
  body('seller').isMongoId(),
  body('deliverySectors').optional().isArray(),
  body('deliverySectors.*').isMongoId(),
  body('canInstantSales').optional().isBoolean(),
  (req: Request, _res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(
        createError(400, `Validation failed: ${errors.array()[0].msg}`, {
          errors: errors.array(),
        }),
      );
    }
    next();
  },
];
