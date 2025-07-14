import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import createError from 'http-errors';
import City from '../models/City.js';

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
export const getCitiesCtrl = asyncHandler(async (_req: Request, res: Response) => {
  const cities = await City.find().sort('name').select("name id");
  res.status(200).json(cities);
});

/**--------------------------------------------------
 * @desc Delete City
 * @route Delete /api/v1/cities/:id
 * @access private (admin only)
---------------------------------------------------*/
export const deleteCityCtrl = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const city = await City.findByIdAndDelete(id);
  if (!city) throw createError(404, 'City not found');
  res.status(200).json({ message: 'City deleted successfully' });
});