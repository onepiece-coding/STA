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
    const pageFromReq = req.query.page as string | undefined;
    const limitFromReq = req.query.limit as string | undefined;
    const search = (req.query.search as string) ?? undefined;

    const filter: Record<string, any> = {};
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    const total = await Category.countDocuments(filter);

    let query = Category.find(filter).lean();

    let page: number | null = null;
    let limit: number | null = null;
    let totalPages: number | null = null;

    if (pageFromReq != null && limitFromReq != null) {
      page = parseInt(pageFromReq, 10);
      limit = parseInt(limitFromReq, 10);

      if (page < 1) page = 1;
      if (limit < 1) limit = 10;

      query = query.skip((page - 1) * limit).limit(limit);
      totalPages = Math.ceil(total / limit);
    }

    const data = await query;

    const meta: Record<string, any> = { total };
    if (page != null && limit != null) {
      meta.page = page;
      meta.limit = limit;
      meta.totalPages = totalPages;
    }

    res.status(200).json({ data, meta });
  },
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
