import { body, validationResult } from 'express-validator';
import createError from 'http-errors';
import { Request, Response, NextFunction } from 'express';
import User from '../models/User.js';

export const validateCreateClient = [
  body('name').isString().notEmpty().withMessage('name is required'),
  body('location').isString().notEmpty().withMessage('location is required'),
  body('typeOfBusiness')
    .isString()
    .notEmpty()
    .withMessage('typeOfBusiness is required'),
  body('city').isMongoId().withMessage('Valid city ID is required'),
  body('sector').isMongoId().withMessage('Valid sector ID is required'),
  body('deliveryMan').isMongoId().withMessage('Valid delivery ID is required'),
  body('phoneNumber')
    .isString()
    .matches(/^\+212(6|7)\d{8}$/)
    .withMessage('Invalid Phone Number'),
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

export const validateUpdateClient = [
  body('name')
    .optional()
    .isString()
    .notEmpty()
    .withMessage('name must be a non-empty string'),
  body('location')
    .optional()
    .isString()
    .notEmpty()
    .withMessage('location must be a non-empty string'),
  body('typeOfBusiness')
    .optional()
    .isString()
    .notEmpty()
    .withMessage('typeOfBusiness must be a non-empty string'),

  body('city')
    .optional()
    .isMongoId()
    .withMessage('city must be a valid MongoId'),
  body('sector')
    .optional()
    .isMongoId()
    .withMessage('sector must be a valid MongoId'),

  body('phoneNumber')
    .optional()
    .isString()
    .matches(/^\+212(6|7)\d{8}$/)
    .withMessage('phoneNumber must be 8–15 digits'),

  body('deliveryMan')
    .optional()
    .isMongoId()
    .withMessage('deliveryMan must be a valid MongoId')
    .bail()
    .custom(async (val, { req }) => {
      // ensure the deliveryMan belongs to this seller
      const sellerId = req.user!._id.toString();
      const dl = await User.findOne({
        _id: val,
        role: 'delivery',
        seller: sellerId,
      })
        .select('deliverySectors')
        .lean();
      if (!dl) {
        throw new Error('deliveryMan is not assigned to you');
      }
      // if sector is changing in the same request, ensure deliveryMan covers it:
      const newSector = req.body.sector || req.body.client?.sector;
      if (newSector && !dl.deliverySectors!.map(String).includes(newSector)) {
        throw new Error('deliveryMan does not cover the specified sector');
      }
      return true;
    }),

  // 6) run the validationResult and forward errors
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
