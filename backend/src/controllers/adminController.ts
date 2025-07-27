import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import createError from 'http-errors';
import User from '../models/User.js';
import Client from '../models/Client.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';

/**
 * @desc   Manually adjust a product’s stock
 * @route  POST /api/v1/admin/adjust-stock
 * @body   { productId, quantityDiff }
 * @access private (admin)
 */
export const manualAdjustCtrl = asyncHandler(async (req, res) => {
  const { productId, quantityDiff } = req.body;
  if (!productId || typeof quantityDiff !== 'number') {
    throw createError(400, 'productId and quantityDiff are required');
  }

  const product = await Product.findById(productId);
  if (!product) throw createError(404, 'Product not found');

  // 1) Update currentStock
  product.currentStock += quantityDiff;
  await product.save();

  res.status(200).json({
    productId,
    newStock: product.currentStock,
  });
});

/**
 * @desc    Reassign everything from one seller to another
 * @route   POST /api/v1/admin/reassign/seller
 * @access  private (admin)
 *
 * Body: { oldSellerId: string, newSellerId: string }
 */
export const reassignSellerBulkCtrl = asyncHandler(
  async (req: Request, res: Response) => {
    const { oldSellerId, newSellerId } = req.body;

    const [oldSeller, newSeller] = await Promise.all([
      User.findOne({ _id: oldSellerId, role: 'seller' }),
      User.findOne({ _id: newSellerId, role: 'seller' }),
    ]);
    if (!oldSeller) throw createError(404, 'Old seller not found');
    if (!newSeller) throw createError(404, 'New seller not found');

    await User.updateMany(
      { role: 'delivery', seller: oldSellerId },
      { $set: { seller: newSellerId } },
    );

    await Client.updateMany(
      { seller: oldSellerId },
      { $set: { seller: newSellerId } },
    );

    res.status(200).json({
      message: 'Reassigned seller data',
      oldSellerId,
      newSellerId,
    });
  },
);

/**
 * @desc    Reassign all clients from one delivery to another
 * @route   POST /api/v1/admin/reassign/delivery
 * @access  private (admin)
 *
 * Body: { oldDeliveryId: string, newDeliveryId: string }
 */
export const reassignDeliveryBulkCtrl = asyncHandler(
  async (req: Request, res: Response) => {
    const { oldDeliveryId, newDeliveryId } = req.body;

    const [oldDel, newDel] = await Promise.all([
      User.findOne({ _id: oldDeliveryId, role: 'delivery' }),
      User.findOne({ _id: newDeliveryId, role: 'delivery' }),
    ]);
    if (!oldDel) throw createError(404, 'Old delivery person not found');
    if (!newDel) throw createError(404, 'New delivery person not found');

    await Client.updateMany(
      { deliveryMan: oldDeliveryId },
      { $set: { deliveryMan: newDeliveryId } },
    );

    await Order.updateMany(
      { deliveryMan: oldDeliveryId, status: 'pending' },
      { $set: { deliveryMan: newDeliveryId } },
    );

    res.status(200).json({
      message: 'Reassigned delivery data',
      oldDeliveryId,
      newDeliveryId,
    });
  },
);
