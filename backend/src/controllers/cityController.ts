import { Request, Response, NextFunction } from 'express';
import asyncHandler from 'express-async-handler';
import createError from 'http-errors';
import City from '../models/City.js';
import Sector from '../models/Sector.js';

/**--------------------------------------------------
 * @desc Create City
 * @route POST /api/v1/cities
 * @access private (admin only)
---------------------------------------------------*/
export const createCityCtrl = asyncHandler(
  async (req: Request, res: Response) => {
    const { name } = req.body;
    const exists = await City.findOne({
      name: { $regex: `^${name}$`, $options: 'i' },
    });
    if (exists) throw createError(409, 'City already exists');
    const city = await City.create({ name });
    res.status(201).json(city);
  },
);

/**--------------------------------------------------
 * @desc Get Cities
 * @route GET /api/v1/cities
 * @access private (Admin/ Seller only)
---------------------------------------------------*/
export const getCitiesCtrl = asyncHandler(
  async (req: Request, res: Response) => {
    const pageFromReq = req.query.page as string | undefined;
    const limitFromReq = req.query.limit as string | undefined;
    const search = (req.query.search as string) ?? undefined;

    const filter: Record<string, any> = {};
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    const total = await City.countDocuments(filter);

    let query = City.find(filter).lean();

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

/**--------------------------------------------------
 * @desc Get City by ID (with its sectors)
 * @route GET /api/v1/cities/:id
 * @access private (admin/seller)
---------------------------------------------------*/
export const getCityByIdCtrl = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const city = await City.findById(id).lean();
    if (!city) throw createError(404, 'City not found');

    // Populate its sectors
    const sectors = await Sector.find({ city: id })
      .select('name _id')
      .sort('name')
      .lean();

    res.status(200).json({ ...city, sectors });
  },
);

/**--------------------------------------------------
 * @desc Update City name
 * @route PATCH /api/v1/cities/:id
 * @access private (admin only)
---------------------------------------------------*/
export const updateCityCtrl = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { name: newName } = req.body;
    if (!newName || typeof newName !== 'string' || !newName.trim()) {
      throw createError(400, 'New city name is required');
    }

    // Check uniqueness excluding this city
    const conflict = await City.findOne({
      _id: { $ne: id },
      name: { $regex: `^${newName.trim()}$`, $options: 'i' },
    });
    if (conflict)
      throw createError(409, 'Another city with that name already exists');

    const updated = await City.findByIdAndUpdate(
      id,
      { name: newName.trim() },
      { new: true },
    );
    if (!updated) throw createError(404, 'City not found');
    res.status(200).json(updated);
  },
);

/**--------------------------------------------------
 * @desc Delete City
 * @route Delete /api/v1/cities/:id
 * @access private (admin only)
---------------------------------------------------*/
export const deleteCityCtrl = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    // Delete all sectors belonging to this city
    await Sector.deleteMany({ city: id });

    // Then delete the city
    const city = await City.findByIdAndDelete(id);
    if (!city) throw createError(404, 'City not found');

    res.status(200).json({
      message:
        'City and its sectors deleted successfully, Please update related staff and clients',
    });
  },
);
