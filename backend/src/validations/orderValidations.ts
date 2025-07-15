import { body, query, param, validationResult } from 'express-validator';
import createError from 'http-errors';
import { Request, Response, NextFunction } from 'express';

export const validateCreateOrder = [
  body('clientId').isMongoId().withMessage('clientId required'),
  body('wantedDate').isISO8601().withMessage('wantedDate must be a valid date'),
  body('items')
    .isArray({ min: 1 })
    .withMessage('items must be non-empty array'),
  body('items.*.productId').isMongoId().withMessage('productId must be valid'),
  body('items.*.soldBy')
    .isIn(['unit', 'carton'])
    .withMessage('soldBy must be "unit" or "carton"'),
  body('items.*.quantity').isInt({ gt: 0 }).withMessage('quantity must be >0'),
  (req: Request, _res: Response, next: NextFunction) => {
    const errs = validationResult(req);
    if (!errs.isEmpty())
      return next(
        createError(400, 'Validation failed', { errors: errs.array() }),
      );
    next();
  },
];

export const validateUpdateOrder = [
  // items only if delivery
  body('items')
    .optional()
    .isArray({ min: 1 })
    .withMessage('items must be a non-empty array'),
  body('items.*.productId')
    .optional()
    .isMongoId()
    .withMessage('items[].productId must be a valid MongoId'),
  body('items.*.soldBy')
    .optional()
    .isIn(['unit', 'carton'])
    .withMessage('items[].soldBy must be "unit" or "carton"'),
  body('items.*.quantity')
    .optional()
    .isInt({ gt: 0 })
    .withMessage('items[].quantity must be a positive integer'),

  // wantedDate only if delivery
  body('wantedDate')
    .optional()
    .isISO8601()
    .withMessage('wantedDate must be a valid date'),

  // status for both roles
  body('status')
    .optional()
    .isIn(['pending', 'done', 'cancelled'])
    .withMessage('status must be one of pending, inProgress, done, cancelled'),

  // run validationResult
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

export const validateGetOrders = [
  query('page').optional().isInt({ gt: 0 }),
  query('limit').optional().isInt({ gt: 0 }),
  query('status')
    .optional()
    .isIn(['pending', 'inProgress', 'done', 'cancelled']),
  query('clientId').optional().isMongoId(),
  query('from').optional().isISO8601(),
  query('to').optional().isISO8601(),
  (req: Request, _res: Response, next: NextFunction) => {
    const errs = validationResult(req);
    if (!errs.isEmpty())
      return next(
        createError(400, `Validation failed: ${errs.array()[0].msg}`, {
          errors: errs.array(),
        }),
      );
    next();
  },
];
