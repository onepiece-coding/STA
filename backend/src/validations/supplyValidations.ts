import { body, ValidationChain, validationResult } from 'express-validator';
import createError from 'http-errors';
import { Request, Response, NextFunction, RequestHandler } from 'express';

export const validateAddBulkSupply: Array<ValidationChain | RequestHandler> = [
  // 1) Body must be a non-empty array
  body()
    .isArray({ min: 1 })
    .withMessage('Request body must be a non-empty array of supply entries'),

  // 2) For each item in the array, we check required fields:
  body('*.productId')
    .isMongoId()
    .withMessage('Each supply entry must have a valid productId'),
  body('*.quantity')
    .isInt({ gt: 0 })
    .withMessage('Each supply entry must have quantity > 0'),
  body('*.expiringAt')
    .isISO8601()
    .withMessage('Each supply entry must have a valid expiringAt date'),

  // 3) Collector to send back 400 + errors[]
  (req: Request, _res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // `errors.array()` gives [{ msg, param, location, ... }, …]
      return next(createError(400, 'Validation failed', { errors: errors.array() }));
    }
    next();
  }
];