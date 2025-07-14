import { body, ValidationChain, validationResult } from 'express-validator';
import createError from 'http-errors';
import { Request, Response, NextFunction, RequestHandler } from 'express';

export const validateCreateSale: Array<ValidationChain | RequestHandler> = [
  body('clientId')
    .exists().withMessage('clientId is required')
    .bail()
    .isMongoId().withMessage('clientId must be a valid MongoId'),
  body('items')
    .exists().withMessage('items is required')
    .bail()
    .isArray({ min: 1 }).withMessage('items must be a non-empty array'),
  body('items.*.productId')
    .exists().withMessage('Each item must have a productId')
    .bail()
    .isMongoId().withMessage('productId must be a valid MongoId'),
  body('items.*.soldBy')
    .exists().withMessage('Each item must have soldBy')
    .bail()
    .isIn(['unit','carton']).withMessage('soldBy must be "unit" or "carton"'),
  body('items.*.quantity')
    .exists().withMessage('Each item must have quantity')
    .bail()
    .isInt({ gt: 0 }).withMessage('quantity must be a positive integer'),
  body('date')
    .exists().withMessage('date is required')
    .bail()
    .isISO8601().withMessage('date must be a valid ISO8601 date'),

  (req: Request, _res: Response, next: NextFunction) => {
    const errs = validationResult(req);
    if (!errs.isEmpty()) {
      return next(createError(400, 'Validation failed', { errors: errs.array() }));
    }
    next();
  }
];

export const validateUpdateSale: Array<ValidationChain | RequestHandler> = [
  body('deliveryStatus')
    .optional()
    .isIn(['ordered','delivered','notDelivered'])
    .withMessage('deliveryStatus must be one of "ordered", "delivered", "notDelivered"'),

  body('return.returnItems')
    .optional()
    .isArray().withMessage('return.returnItems must be an array'),
  body('return.returnItems.*.productId')
    .optional()
    .isMongoId().withMessage('return.returnItems[].productId must be a valid MongoId'),
  body('return.returnItems.*.soldBy')
    .optional()
    .isIn(['unit','carton']).withMessage('return.returnItems[].soldBy must be "unit" or "carton"'),
  body('return.returnItems.*.quantity')
    .optional()
    .isInt({ gt: 0 }).withMessage('return.returnItems[].quantity must be a positive integer'),
  body('return.returnTotal')
    .optional()
    .isFloat({ min: 0 }).withMessage('return.returnTotal must be a non-negative number'),
  body('returnGlobal')
    .optional()
    .isFloat({ min: 0 }).withMessage('returnGlobal must be a non-negative number'),
  body('paymentType')
    .optional()
    .isIn(['total','partiel','credit'])
    .withMessage('paymentType must be "total", "partiel", or "credit"'),
  body('ammountPaid')
    .optional()
    .isFloat({ min: 0 }).withMessage('ammountPaid must be a non-negative number'),

  (req: Request, _res: Response, next: NextFunction) => {
    const errs = validationResult(req);
    if (!errs.isEmpty()) {
      return next(createError(400, 'Validation failed', { errors: errs.array() }));
    }
    next();
  }
];
