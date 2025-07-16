import { Request, Response, NextFunction } from 'express';
import asyncHandler from 'express-async-handler';
import createError from 'http-errors';
import Category from '../models/Category.js';

/**-----------------------------------
 * @desc   Create Category
 * @route  /api/v1/categories
 * @method POST
 * @access private(admin)
--------------------------------------*/
export const createCategoryCtrl = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    let cat = await Category.findOne({
      name: { $regex: `^${req.body.name}$`, $options: 'i' },
    });
    if (cat) throw createError(409, 'Category already exist');
    cat = await Category.create(req.body);
    res.status(201).json(cat);
  },
);

/**-----------------------------------
 * @desc   Get Category
 * @route  /api/v1/categories/:id
 * @method POST
 * @access private(admin)
--------------------------------------*/
export const getCategoriesCtrl = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const page   = parseInt(req.query.page  as string, 10) || 1;
    const limit  = parseInt(req.query.limit as string, 10) || 10;
    const search = (req.query.search as string) ?? undefined;

    const filter: Record<string, any> = {};
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    const total = await Category.countDocuments(filter);

    const data = await Category.find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort('name')
      .lean();

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      data,
      meta: {
        total,
        page,
        limit,
        totalPages
      }
    });
  }
);


/**-----------------------------------
 * @desc   Delete Category
 * @route  /api/v1/category/:id
 * @method DELETE
 * @access private(admin)
--------------------------------------*/
export const deleteCategoryCtrl = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) throw createError(404, 'Category not found');
    res.status(200).json({ message: 'Category deleted successfully' });
  },
);
