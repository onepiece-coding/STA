import { query, validationResult } from 'express-validator';
import createError from 'http-errors';
import { Request, Response, NextFunction } from 'express';

export const validateStats = [
  // from and to must be ISO dates if provided
  query('from')
    .optional()
    .isISO8601()
    .withMessage('from must be a valid ISO8601 date'),
  query('to')
    .optional()
    .isISO8601()
    .withMessage('to must be a valid ISO8601 date'),
  // sellerId only for admins
  query('sellerId')
    .optional()
    .isMongoId()
    .withMessage('sellerId must be a valid MongoId'),
  // final collector
  (req: Request, _res: Response, next: NextFunction) => {
    const errs = validationResult(req);
    if (!errs.isEmpty()) {
      return next(createError(400, 'Invalid query parameters', { errors: errs.array() }));
    }
    next();
  }
];