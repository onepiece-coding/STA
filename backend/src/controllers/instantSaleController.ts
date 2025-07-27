import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import createError from 'http-errors';
import Product from '../models/Product.js';
import Sale from '../models/Sale.js';
import Supply from '../models/Supply.js';

interface InstantSaleItem {
  productId: string;
  soldBy: 'unit' | 'carton';
  quantity: number;
}

interface CreateInstantSaleDto {
  items: InstantSaleItem[];
  date?: string;
  paymentMethod: string;
}

// Utility to build a unique saleNumber (date + counter)
async function makeSaleNumber(): Promise<string> {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const count = await Sale.countDocuments({
    saleNumber: new RegExp(`^S-${date}`),
  });
  return `S-${date}-${String(count + 1).padStart(4, '0')}`;
}

export const createInstantSaleCtrl = asyncHandler(
  async (req: Request<{}, {}, CreateInstantSaleDto>, res: Response) => {
    const sellerId = req.user!._id.toString();
    const { items, date, paymentMethod } = req.body;

    // 1) Bulk fetch products
    const productIds = items.map((i) => i.productId);
    const products = await Product.find({ _id: { $in: productIds } });
    const prodMap = new Map(products.map((p) => [p.id, p]));

    // 2) Pre‑check stock & build line items
    let totalAmount = 0;
    const lineItems = items.map((it) => {
      const p = prodMap.get(it.productId);
      if (!p) throw createError(404, `Product ${it.productId} not found`);
      if (p.currentStock < it.quantity) {
        throw createError(400, `Insufficient stock for ${p.name}`);
      }
      // no discounts for instant sales
      const unitPrice = p.unitPrice;
      const total = p.unitPrice * it.quantity;
      totalAmount += total;
      return {
        productId: p._id,
        soldBy: it.soldBy,
        quantity: it.quantity,
        discount: 0,
        unitPrice,
        total,
      };
    });

    // 3) Deduct stock
    for (let li of lineItems) {
      let remainingToDeduct = li.quantity;
      const supplies = await Supply.find({
        productId: li.productId,
        remainingQty: { $gt: 0 },
      })
        .sort('expiringAt')
        .exec();

      for (let sup of supplies) {
        if (remainingToDeduct === 0) break;
        const take = Math.min(sup.remainingQty, remainingToDeduct);
        const supRes = await Supply.updateOne(
          { _id: sup._id, remainingQty: { $gte: take } },
          { $inc: { remainingQty: -take } },
        );
        if (supRes.modifiedCount !== 1) {
          throw createError(
            400,
            `Batch stock changed mid‐sale for product ${li.productId}`,
          );
        }
        remainingToDeduct -= take;
      }

      const prodRes = await Product.updateOne(
        { _id: li.productId, currentStock: { $gte: li.quantity } },
        { $inc: { currentStock: -li.quantity } },
      );
      if (prodRes.modifiedCount !== 1) {
        throw createError(
          400,
          `Insufficient stock for product ${li.productId}`,
        );
      }
    }

    // 4) Create sale record
    const saleNumber = await makeSaleNumber();
    const sale = await Sale.create({
      saleNumber,
      date: date ? new Date(date) : new Date(),
      seller: sellerId, // this “instant” user
      items: lineItems,
      totalAmount,
      netAmount: totalAmount,
      amountPaid: totalAmount,
      deliveryStatus: 'delivered',
      paymentMethod,
      // client/deliveryMan/return etc. left undefined
    });

    res.status(201).json(sale);
  },
);
