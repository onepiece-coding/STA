import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import createError from 'http-errors';
import { Types } from 'mongoose';
import User from '../models/User.js';

/**--------------------------------------
 * @desc    Create Seller
 * @route   /api/v1/user/sellers
 * @method  POST
 * @access  private (admin)
-----------------------------------------*/
export const createSellerCtrl = asyncHandler(
  async (req: Request, res: Response) => {
    const { username, password, sectors } = req.body;
    if (await User.findOne({ username }))
      throw createError(409, 'Username taken');
    const seller = await User.create({
      username,
      password,
      role: 'seller',
      sectors,
    });
    seller.password = undefined!;
    res.status(201).json(seller);
  },
);

/**--------------------------------------
 * @desc    Get Sellers
 * @route   /api/v1/user/sellers
 * @method  GET
 * @access  private (admin)
-----------------------------------------*/
export const getSellersCtrl = asyncHandler(async (req: Request, res: Response) => {
  // Read query params
  const page     = parseInt(req.query.page  as string, 10) || 1;
  const limit    = parseInt(req.query.limit as string, 10) || 10;
  const search   = (req.query.search  as string) ?? '';

  // Build filter
  const filter: Record<string, any> = { role: 'seller' };
  if (search) {
    filter.username = { $regex: search, $options: 'i' };
  }

  // Count total matching documents
  const total = await User.countDocuments(filter);

  // Query page of sellers
  const sellers = await User.find(filter)
    .select('-password -__v')
    .populate('sectors', 'name')
    .skip((page - 1) * limit)
    .limit(limit)
    .sort('username')
    .lean();

  // Prepare metadata
  const totalPages = Math.ceil(total / limit);

  // Return
  res.status(200).json({
    data: sellers,
    meta: {
      total,
      page,
      limit,
      totalPages
    }
  });
});

/**
 * @desc    Get a single seller by ID
 * @route   GET /api/v1/user/sellers/:id
 * @access  private (admin or the seller themselves)
 */
export const getSellerByIdCtrl = asyncHandler(
  async (req: Request, res: Response) => {
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
  },
);

/**-------------------------------------------
 * @desc    Update Seller by Id
 * @route   /api/v1/user/sellers/:id
 * @method  PATCH
 * @access  private (admin / Seller himself)
----------------------------------------------*/
export const updateSellerCtrl = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const seller = await User.findById(id);
    if (!seller || seller.role !== 'seller')
      throw createError(404, 'Seller not found');

    const updates: Partial<Record<string, any>> = {};
    if (req.body.password) updates.password = req.body.password;
    if (Array.isArray(req.body.sectors) && req.user.role === 'admin')
      updates.sectors = req.body.sectors;

    // If no updatable fields were provided, abort with 400
    if (Object.keys(updates).length === 0) {
      throw createError(400, 'Nothing to update');
    }

    Object.assign(seller, updates);
    await seller.save();

    seller.password = undefined!;

    res.status(200).json(seller);
  },
);

/**-------------------------------------------
 * @desc    Delete Seller by Id
 * @route   /api/v1/user/sellers/:id
 * @method  DELETE
 * @access  private (admin)
----------------------------------------------*/
export const deleteSellerCtrl = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const seller = await User.findOneAndDelete({ _id: id, role: 'seller' });
    if (!seller) throw createError(404, 'Seller not found');
    res.status(200).json({ message: 'Seller deleted' });
  },
);

/**--------------------------------------
 * @desc    Create Delivery
 * @route   /api/v1/user/delivery
 * @method  POST
 * @access  private (admin)
-----------------------------------------*/
export const createDeliveryCtrl = asyncHandler(
  async (req: Request, res: Response) => {
    const { username, password, seller, deliverySectors, canInstantSales } =
      req.body;
    if (await User.findOne({ username }))
      throw createError(409, 'Username taken');
    // ensure the seller exists
    const parent = await User.findOne({ _id: seller, role: 'seller' });
    if (!parent) throw createError(404, 'Parent seller not found');

    let sectors: Types.ObjectId[] = deliverySectors;
    if (!sectors || sectors.length === 0) {
      sectors = parent.sectors!;
    }

    const delivery = await User.create({
      username,
      password,
      role: 'delivery',
      seller,
      deliverySectors: sectors,
      canInstantSales: !!canInstantSales,
    });

    delivery.password = undefined!;

    res.status(201).json(delivery);
  },
);

/**-----------------------------------------
 * @desc    Get Delivery
 * @route   /api/v1/user/Delivery
 * @method  GET
 * @access  private (admin/ Parent seller)
--------------------------------------------*/
export const getDeliveryCtrl = asyncHandler(
  async (req: Request, res: Response) => {
    const page       = parseInt(req.query.page as string, 10) || 1;
    const limit      = parseInt(req.query.limit as string, 10) || 10;
    const search     = (req.query.search    as string) ?? '';
    const sellerId   = (req.query.sellerId  as string) ?? '';

    const filter: any = { role: 'delivery' };

    if (req.user.role === 'admin') {
      if (sellerId) {
        filter.seller = sellerId;
      }
    } else {
      filter.seller = req.user._id;
    }

    if (search) {
      filter.username = { $regex: search, $options: 'i' };
    }

    const total = await User.countDocuments(filter);

    const data = await User.find(filter)
      .select('-password -__v')
      .populate('seller', 'username')
      .populate('deliverySectors', 'name')
      .sort('username')
      .skip((page - 1) * limit)
      .limit(limit)
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


/**
 * @desc    Get a single delivery user by ID
 * @route   GET /api/v1/user/delivery/:id
 * @access  private (admin or parent seller)
 */
export const getDeliveryByIdCtrl = asyncHandler(
  async (req: Request, res: Response) => {
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
  },
);

/**-----------------------------------------
 * @desc    Update Delivery by Id
 * @route   /api/v1/user/Delivery/:id
 * @method  PATCH
 * @access  private (admin)
--------------------------------------------*/
export const updateDeliveryCtrl = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const delivery = await User.findOne({ _id: id, role: 'delivery' });
    if (!delivery) throw createError(404, 'Delivery user not found');

    const updates: Partial<Record<string, any>> = {};
    if (req.body.password) updates.password = req.body.password;
    if (req.user.role === 'admin') {
      if (Array.isArray(req.body.deliverySectors)) {
        updates.deliverySectors = req.body.deliverySectors;
      }
      if (typeof req.body.canInstantSales === 'boolean') {
        updates.canInstantSales = req.body.canInstantSales;
      }
      if (req.body.seller) {
        // check type???
        updates.seller = req.body.seller;
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
  },
);

/**-------------------------------------------
 * @desc    Delete Delivery by Id
 * @route   /api/v1/user/delivery/:id
 * @method  DELETE
 * @access  private (admin)
----------------------------------------------*/
export const deleteDeliveryCtrl = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const del = await User.findOneAndDelete({ _id: id, role: 'delivery' });
    if (!del) throw createError(404, 'Delivery user not found');
    res.status(200).json({ message: 'Delivery user deleted' });
  },
);

/**--------------------------------------
 * @desc    Create Instant Seller
 * @route   /api/v1/user/instant-seller
 * @method  POST
 * @access  private (admin)
-----------------------------------------*/
export const createInstantSellerCtrl = asyncHandler(
  async (req: Request, res: Response) => {
    const { username, password, sectors } = req.body;
    if (await User.findOne({ username }))
      throw createError(409, 'Username taken');
    const seller = await User.create({
      username,
      password,
      role: 'instant',
      sectors,
    });
    seller.password = undefined!;
    res.status(201).json(seller);
  },
);

/**--------------------------------------
 * @desc    Get Instant Sellers
 * @route   /api/v1/user/instant-sellers
 * @method  GET
 * @access  private (admin)
-----------------------------------------*/
export const getInstantSellersCtrl = asyncHandler(async (req: Request, res: Response) => {
  // Read query params
  const page     = parseInt(req.query.page  as string, 10) || 1;
  const limit    = parseInt(req.query.limit as string, 10) || 10;
  const search   = (req.query.search  as string) ?? '';

  // Build filter
  const filter: Record<string, any> = { role: 'instant' };
  if (search) {
    filter.username = { $regex: search, $options: 'i' };
  }

  // Count total matching documents
  const total = await User.countDocuments(filter);

  // Query page of sellers
  const instant = await User.find(filter)
    .select('-password -__v')
    .populate('sectors', 'name')
    .skip((page - 1) * limit)
    .limit(limit)
    .sort('username')
    .lean();

  // Prepare metadata
  const totalPages = Math.ceil(total / limit);

  // Return
  res.status(200).json({
    data: instant,
    meta: {
      total,
      page,
      limit,
      totalPages
    }
  });
});

/**
 * @desc    Get a single instant seller by ID
 * @route   GET /api/v1/user/sellers/:id
 * @access  private (admin or the seller themselves)
 */
export const getInstantSellerByIdCtrl = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const me = req.user!;

    // Only admins or the seller themselves may fetch
    const filter: any = { _id: id, role: 'instant' };
    if (me.role !== 'admin') {
      filter._id = me._id;
    }

    const seller = await User.findOne(filter)
      .select('-password -__v')
      .populate('sectors', 'name')
      .lean();

    if (!seller) {
      throw createError(404, 'Instant Seller not found');
    }

    res.status(200).json(seller);
  },
);

/**-------------------------------------------
 * @desc    Update instant Seller by Id
 * @route   /api/v1/user/instant-sellers/:id
 * @method  PATCH
 * @access  private (admin / Seller himself)
----------------------------------------------*/
export const updateInstantSellerCtrl = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const instant = await User.findById(id);
    if (!instant || instant.role !== 'instant')
      throw createError(404, 'Instant Seller not found');

    const updates: Partial<Record<string, any>> = {};
    if (req.body.password) updates.password = req.body.password;
    if (Array.isArray(req.body.sectors) && req.user.role === 'admin')
      updates.sectors = req.body.sectors;

    // If no updatable fields were provided, abort with 400
    if (Object.keys(updates).length === 0) {
      throw createError(400, 'Nothing to update');
    }

    Object.assign(instant, updates);
    await instant.save();

    instant.password = undefined!;

    res.status(200).json(instant);
  },
);

/**-------------------------------------------
 * @desc    Delete instant Seller by Id
 * @route   /api/v1/user/instant-sellers/:id
 * @method  DELETE
 * @access  private (admin)
----------------------------------------------*/
export const deleteInstantSellerCtrl = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const instant = await User.findOneAndDelete({ _id: id, role: 'instant' });
    if (!instant) throw createError(404, 'Instant Seller not found');
    res.status(200).json({ message: 'Instant seller deleted' });
  },
);
