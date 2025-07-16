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
export const createCityCtrl = asyncHandler(async (req: Request, res: Response) => {
  const { name } = req.body;
  const exists = await City.findOne({ name: { $regex: `^${name}$`, $options: 'i' } });
  if (exists) throw createError(409, 'City already exists');
  const city = await City.create({ name });
  res.status(201).json(city);
});

/**--------------------------------------------------
 * @desc Get Cities
 * @route GET /api/v1/cities
 * @access private (Admin/ Seller only)
---------------------------------------------------*/
export const getCitiesCtrl = asyncHandler(async (req: Request, res: Response) => {
  const page   = parseInt(req.query.page  as string, 10) || 1;
  const limit  = parseInt(req.query.limit as string, 10) || 10;
  const search = (req.query.search as string) ?? undefined;
  
  const filter: Record<string, any> = {};
  if (search) {
    filter.name = { $regex: search, $options: 'i' };
  }
  
  const total = await City.countDocuments(filter);
  
  const data = await City.find(filter)
    .select("name _id")
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
})

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
  }
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
      name: { $regex: `^${newName.trim()}$`, $options: 'i' }
    });
    if (conflict) throw createError(409, 'Another city with that name already exists');

    const updated = await City.findByIdAndUpdate(
      id,
      { name: newName.trim() },
      { new: true }
    );
    if (!updated) throw createError(404, 'City not found');
    res.status(200).json(updated);
  }
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

    res.status(200).json({ message: 'City and its sectors deleted successfully, Please update related staff and clients' });
  }
);