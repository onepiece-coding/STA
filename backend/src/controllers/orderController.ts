import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import createError from 'http-errors';
import Order from '../models/Order.js';
import Client from '../models/Client.js';

/**
 * @desc   Delivery creates a new order for a client
 * @route  POST /api/v1/orders
 * @access private(delivery)
 */
export const createOrderCtrl = asyncHandler(async (req: Request, res: Response) => {
  const deliveryMan = req.user!._id;
  const { clientId, items, wantedDate } = req.body;

  // 1) Ensure the client is assigned to this deliveryMan
  const client = await Client.findOne({ _id: clientId, deliveryMan });
  if (!client) throw createError(404, 'Client not found or not yours');

  // 2) Build & save
  const order = await Order.create({
    deliveryMan,
    seller: client.seller,
    client: clientId,
    items,
    wantedDate
  });

  res.status(201).json(order);
});

/**
 * @desc   Get orders (delivery sees their own, sellers see orders for their clients)
 * @route  GET /api/v1/orders
 * @access private(delivery|seller)
 */
export const getOrdersCtrl = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const { page = '1', limit = '10', status, clientId, from, to } = req.query as Record<string,string>;

  const p = Math.max(1, parseInt(page,10));
  const l = Math.max(1, parseInt(limit,10));
  const skip = (p - 1)*l;

  // Build filter
  const filter: any = {};
  if (user.role === 'delivery') filter.deliveryMan = user._id;
  if (user.role === 'seller')    filter.seller      = user._id;
  if (status)    filter.status    = status;
  if (clientId)  filter.client    = clientId;
  if (from || to) {
    filter.wantedDate = {};
    if (from) filter.wantedDate.$gte = new Date(from);
    if (to)   filter.wantedDate.$lte = new Date(to);
  }

  const total = await Order.countDocuments(filter);
  const data  = await Order.find(filter)
    .populate('client','name clientNumber')
    .populate('deliveryMan','username')
    .sort('-createdAt')
    .skip(skip)
    .limit(l)
    .lean();

  res.status(200).json({
    data,
    meta: {
      total,
      page: p,
      limit: l,
      totalPages: Math.ceil(total/l)
    }
  });
});

/**
 * @desc   Seller or Delivery fetch a single order by ID
 * @route  GET /api/v1/orders/:id
 * @access private(delivery|seller)
 */
export const getOrderByIdCtrl = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const { id } = req.params;

  const filter: any = { _id: id };
  if (user.role === 'delivery') filter.deliveryMan = user._id;
  if (user.role === 'seller')    filter.seller      = user._id;

  const order = await Order.findOne(filter)
    .populate('client','_id name clientNumber')
    .populate('deliveryMan','username')
    .lean();

  if (!order) throw createError(404, 'Order not found');
  res.status(200).json(order);
});


/**
 * @desc    Update an existing order
 * @route   PATCH /api/v1/orders/:id
 * @access  private (delivery or seller)
 */
export const updateOrderCtrl = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const { id } = req.params;

  // 1) Fetch the order
  const order = await Order.findById(id);
  if (!order) throw createError(404, 'Order not found');

  // 2) Ownership / role check
  if (user.role === 'delivery' && !order.deliveryMan.equals(user._id)) {
    throw createError(403, 'Not your order');
  }
  if (user.role === 'seller' && !order.seller.equals(user._id)) {
    throw createError(403, 'Not your order');
  }

  // 3) Apply allowed updates
  //  - delivery can change items, wantedDate, status
  //  - seller can only change status (e.g. to 'inProgress' or 'done')
  if (req.body.items && user.role === 'delivery') {
    order.items = req.body.items;
  }
  if (req.body.wantedDate && user.role === 'delivery') {
    order.wantedDate = new Date(req.body.wantedDate);
  }
  if (req.body.status) {
    // both roles may update status, but enforce valid enum
    const valid = ['pending','inProgress','done','cancelled'];
    if (!valid.includes(req.body.status)) {
      throw createError(400, 'Invalid status value');
    }
    order.status = req.body.status;
  }

  // 4) Save & respond
  await order.save();
  res.status(200).json(order);
});


/**
 * @desc    Delete an order
 * @route   DELETE /api/v1/orders/:id
 * @access  private (delivery or seller)
 */
export const deleteOrderCtrl = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const { id } = req.params;

  // 1) Find the order
  const order = await Order.findById(id);
  if (!order) throw createError(404, 'Order not found');

  // 2) Ownership check
  if (user.role === 'delivery' && !order.deliveryMan.equals(user._id)) {
    throw createError(403, 'Not your order');
  }
  if (user.role === 'seller' && !order.seller.equals(user._id)) {
    throw createError(403, 'Not your order');
  }

  // 3) Delete
  await order.deleteOne();
  res.status(200).json({ message: 'Order deleted' });
});