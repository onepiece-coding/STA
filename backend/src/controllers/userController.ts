import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import createError from 'http-errors';
import User from '../models/User.js';
import { REPLCommand } from 'repl';
import { Types } from 'mongoose';

/**--------------------------------------
 * @desc    Create Seller
 * @route   /api/v1/user/sellers
 * @method  POST
 * @access  private (admin)
-----------------------------------------*/
export const createSellerCtrl = asyncHandler(async (req: Request, res: Response) => {
  const { username, password, sectors } = req.body;
  if (await User.findOne({ username })) throw createError(409, 'Username taken');
  const seller = await User.create({ username, password, role: 'seller', sectors });
  seller.password = undefined!;
  res.status(201).json(seller);
});

/**--------------------------------------
 * @desc    Get Sellers
 * @route   /api/v1/user/sellers
 * @method  GET
 * @access  private (admin)
-----------------------------------------*/
export const getSellersCtrl = asyncHandler(async (_req, res) => {
  const sellers = await User.find({ role: 'seller' }).select('-password -__v').populate('sectors','name');
  res.status(200).json(sellers);
});

/**
 * @desc    Get a single seller by ID
 * @route   GET /api/v1/user/sellers/:id
 * @access  private (admin or the seller themselves)
 */
export const getSellerByIdCtrl = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const me = req.user!;

  // Only admins or the seller themselves may fetch
  const filter: any = { _id: id, role: 'seller' };
  if (me.role !== 'admin') {
    filter._id = me._id;
  }

  const seller = await User.findOne(filter)
    .select('-password -__v')
    .populate('sectors', 'name')
    .lean();

  if (!seller) {
    throw createError(404, 'Seller not found');
  }

  res.status(200).json(seller);
});

/**-------------------------------------------
 * @desc    Update Seller by Id
 * @route   /api/v1/user/sellers/:id
 * @method  PATCH
 * @access  private (admin / Seller himself)
----------------------------------------------*/
export const updateSellerCtrl = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const seller = await User.findById(id);
  if (!seller || seller.role !== 'seller') throw createError(404, 'Seller not found');

  const updates: Partial<Record<string, any>> = {};
  if (req.body.password && req.user._id === seller._id) updates.password = req.body.password;
  if (Array.isArray(req.body.sectors) && req.user.role === 'admin')  updates.sectors  = req.body.sectors;
  
  // If no updatable fields were provided, abort with 400
  if (Object.keys(updates).length === 0) {
    throw createError(400, 'Nothing to update');
  }

  Object.assign(seller, updates);
  await seller.save();

  seller.password = undefined!;

  res.status(200).json(seller);
});

/**-------------------------------------------
 * @desc    Delete Seller by Id
 * @route   /api/v1/user/sellers/:id
 * @method  DELETE
 * @access  private (admin)
----------------------------------------------*/
export const deleteSellerCtrl = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const seller = await User.findOneAndDelete({ _id: id, role: 'seller' });
  if (!seller) throw createError(404, 'Seller not found');
  res.status(200).json({ message: 'Seller deleted' });
});

/**--------------------------------------
 * @desc    Create Delivery
 * @route   /api/v1/user/delivery
 * @method  POST
 * @access  private (admin)
-----------------------------------------*/
export const createDeliveryCtrl = asyncHandler(async (req: Request, res: Response) => {
  const { username, password, seller, deliverySectors, canInstantSales } = req.body;
  if (await User.findOne({ username })) throw createError(409, 'Username taken');
  // ensure the seller exists
  const parent = await User.findOne({ _id: seller, role: 'seller' });
  if (!parent) throw createError(404, 'Parent seller not found');

  let sectors:Types.ObjectId[] = deliverySectors;
  if(!sectors || sectors.length === 0) {
    sectors = parent.sectors!;
  }

  const delivery = await User.create({
    username,
    password,
    role: 'delivery',
    seller,
    deliverySectors: sectors,
    canInstantSales: !!canInstantSales
  });

  delivery.password = undefined!;

  res.status(201).json(delivery);
});

/**-----------------------------------------
 * @desc    Get Delivery
 * @route   /api/v1/user/Delivery
 * @method  GET
 * @access  private (admin/ Parent seller)
--------------------------------------------*/
export const getDeliveryCtrl = asyncHandler(async (req:Request, res: Response) => {
  const filters:any = {}

  if(req.user.role === 'admin') filters.role = 'delivery';
  if (req.user.role === 'seller') {
    filters.role = 'delivery';
    filters.seller = req.user._id;
  }

  const list = await User.find(filters)
    .select('-password -__v')
    .populate('seller','username')
    .populate('deliverySectors','name');

  res.status(200).json(list);
});

/**
 * @desc    Get a single delivery user by ID
 * @route   GET /api/v1/user/delivery/:id
 * @access  private (admin or parent seller)
 */
export const getDeliveryByIdCtrl = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const me = req.user!;

  // Admins may fetch any; sellers only their own delivery staff
  const filter: any = { _id: id, role: 'delivery' };
  if (me.role === 'seller') {
    filter.seller = me._id;
  }

  const delivery = await User.findOne(filter)
    .select('-password -__v')
    .populate('seller', 'username')
    .populate('deliverySectors', 'name')
    .lean();

  if (!delivery) {
    throw createError(404, 'Delivery user not found');
  }

  res.status(200).json(delivery);
});

/**-----------------------------------------
 * @desc    Update Delivery by Id
 * @route   /api/v1/user/Delivery/:id
 * @method  PATCH
 * @access  private (admin)
--------------------------------------------*/
export const updateDeliveryCtrl = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const delivery = await User.findOne({ _id: id, role: 'delivery' });
  if (!delivery) throw createError(404, 'Delivery user not found');

  const updates: Partial<Record<string, any>> = {};
  if (req.body.password && req.user._id?.toString() === delivery._id?.toString()) updates.password = req.body.password;
  if (req.user.role === 'admin') {
    if (Array.isArray(req.body.deliverySectors)) {
      updates.deliverySectors = req.body.deliverySectors;
    }
    if (typeof req.body.canInstantSales === 'boolean') {
      updates.canInstantSales = req.body.canInstantSales;
    }
  }

  // If no updatable fields were provided, abort with 400
  if (Object.keys(updates).length === 0) {
    throw createError(400, 'Nothing to update');
  }

  Object.assign(delivery, updates);
  await delivery.save();

  delivery.password = undefined!;
  res.status(200).json(delivery);
});

/**-------------------------------------------
 * @desc    Delete Delivery by Id
 * @route   /api/v1/user/delivery/:id
 * @method  DELETE
 * @access  private (admin)
----------------------------------------------*/
export const deleteDeliveryCtrl = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const del = await User.findOneAndDelete({ _id: id, role: 'delivery' });
  if (!del) throw createError(404, 'Delivery user not found');
  res.status(200).json({ message: 'Delivery user deleted' });
});