import { NextFunction, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import createError from "http-errors";

export const validateCreateCategory = [
  body('name').isString().notEmpty().withMessage('name is required'),
  (req: Request, _res:Response, next:NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return  next(createError(400, 'Validation failed', { errors: errors.array() }));
    }
    next();
  }
];