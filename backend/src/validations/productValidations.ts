import { NextFunction, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import createError from "http-errors";

export const validateCreateProduct = [
  body('name').isString().notEmpty().withMessage('Name is required'),
  body('categoryId').isMongoId().withMessage('Valid categoryId is required'),
  body('unitPrice').isFloat({ gt: 0 }).withMessage('unitPrice must be a positive number'),
  body('discountRule').isObject(),
  body('discountRule.minQty').isInt({ min: 1 }).withMessage('discountRule.minQty must be at least 1'),
  body('discountRule.percent').isFloat({ min: 0, max: 100 }).withMessage('discountRule.percent must be between 0 and 100'),
  (req: Request, _res:Response, next:NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return  next(createError(400, 'Validation failed', { errors: errors.array() }));
    }
    next();
  }
];

export const validateUpdateProduct = [
  body('name').optional().isString().notEmpty(),
  body('categoryId').optional().isMongoId(),
  body('unitPrice').optional().isFloat({ gt: 0 }).withMessage('unitPrice must be a positive number'),
  body('discountRule').optional().isObject(),
  body('discountRule.minQty').optional().isInt({ min: 1 }).withMessage('discountRule.minQty must be at least 1'),
  body('discountRule.percent').optional().isFloat({ min: 0, max: 100 }).withMessage('discountRule.percent must be between 0 and 100'),
  body('globalDiscountPercent').optional().isFloat({ min: 0, max: 100 }).withMessage('globalDiscountPercent must be between 0 and 100'),
  (req: Request, _res:Response, next:NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return  next(createError(400, 'Validation failed', { errors: errors.array() }));
    }
    next();
  }
];