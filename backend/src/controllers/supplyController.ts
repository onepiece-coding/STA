import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import createError from 'http-errors';
import Product from '../models/Product.js';
import Supply from '../models/Supply.js';

/**
 * @desc   Add one supply event to *many* products at once
 * @route  POST /api/v1/supplies
 * @body   [{ productId, quantity, expiringAt }, …]
 */
export const addBulkSupplyCtrl = asyncHandler(async (req, res) => {
  const entries: Array<{
    productId: string;
    quantity: number;
    expiringAt: Date;
  }> = req.body;
  if (!Array.isArray(entries) || entries.length === 0) {
    throw createError(400, 'You must supply a non‑empty array');
  }

  const now = new Date();
  const created: any[] = [];

  for (let { productId, quantity, expiringAt } of entries) {
    // 1) Create the supply record
    const supply = await Supply.create({
      productId,
      supplyDate: now,
      quantity,
      remainingQty: quantity,
      expiringAt: new Date(expiringAt),
    });
    created.push(supply);

    // 2) Update product’s currentStock and nextExpiryDate
    const product = await Product.findById(productId);
    if (!product) continue;

    product.currentStock += quantity;
    product.nextExpiryDate = new Date(expiringAt);

    await product.save();
  }

  res.status(201).json(created);
});

/**
 * @desc   List products whose *total remaining stock* is below a threshold
 * @route  GET /api/v1/alerts/low-stock?threshold=10
 * @access private (admin)
 */
export const lowStockAlertsCtrl = asyncHandler(
  async (req: Request, res: Response) => {
    const threshold = parseInt((req.query.threshold as string) || '10', 10);

    const lowStockProducts = await Product.find(
      { currentStock: { $lt: threshold } },
      'name currentStock pictureUrl',
    ).lean();

    const results = lowStockProducts.map((p) => ({
      productId: p._id,
      name: p.name,
      remainingQty: p.currentStock,
      photo: p.pictureUrl,
    }));

    res.status(200).json(results);
  },
);

/**
 * @desc   List supplies that will expire within N days,
 *         *but only those that still have more than X units remaining*
 * @route  GET /api/v1/alerts/expiring?days=14&minQty=5
 * @access private (admin)
 */
export const expiringSoonAlertsCtrl = asyncHandler(
  async (req: Request, res: Response) => {
    const days = parseInt((req.query.days as string) || '14', 10);
    const minQty = parseInt((req.query.minQty as string) || '1', 10);

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + days);

    const products = await Product.find(
      {
        nextExpiryDate: { $lte: cutoff },
        currentStock: { $gte: minQty },
      },
      'name nextExpiryDate currentStock pictureUrl',
    ).lean();

    const results = products.map((p) => ({
      productId: p._id,
      name: p.name,
      nextExpiry: p.nextExpiryDate,
      remainingQty: p.currentStock,
      photo: p.pictureUrl,
    }));

    res.status(200).json(results);
  },
);
