import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import createError from 'http-errors';
import Sector from '../models/Sector.js';
import City from '../models/City.js';
import User from '../models/User.js';

/**--------------------------------------------------
 * @desc Create Sector
 * @route POST /api/v1/Sectors
 * @access private (admin only)
---------------------------------------------------*/
export const createSectorCtrl = asyncHandler(async (req: Request, res: Response) => {
  const { name, city } = req.body;
  const c = await City.findById(city);
  if (!c) throw createError(404, 'City not found');
  const exists = await Sector.findOne({ city, name: { $regex: `^${name}$`, $options: 'i' } });
  if (exists) throw createError(409, 'Sector already exists in this city');
  const sector = await Sector.create({ name, city });
  res.status(201).json(sector);
});

/**--------------------------------------------------
 * @desc Get Sectors By City
 * @route GET /api/v1/sectors/:cityId/sectors
 * @access private (Admin/ Seller only)
---------------------------------------------------*/
export const getSectorsByCityCtrl = asyncHandler(async (req: Request, res: Response) => {
  const { cityId } = req.params;
  const sectors = await Sector.find({ city: cityId }).sort('name').populate("city", "name");
  res.status(200).json(sectors);
});

/**--------------------------------------------------
 * @desc Delete Sector
 * @route Delete /api/v1/sectors/:id
 * @access private (admin only)
---------------------------------------------------*/
export const deleteSectorCtrl = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const sector = await Sector.findByIdAndDelete(id);
  if (!sector) throw createError(404, 'Sector not found');

  await User.updateMany(
    { role: 'seller' },
    { $pull: { sectors: sector._id } }
  );

  await User.updateMany(
    { role: 'delivery' },
    { $pull: { deliverySectors: sector._id } }
  );

  res.status(200).json({ message: 'Sector deleted and removed from all users' });
});