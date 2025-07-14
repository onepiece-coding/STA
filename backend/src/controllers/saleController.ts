import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import createError from 'http-errors';
import mongoose from 'mongoose';
import Sale from '../models/Sale.js';
import Client from '../models/Client.js';
import Product from '../models/Product.js';
// import { generateInvoicePDF } from '../utils/invoice.js'; // optional

// Utility to build a unique saleNumber (date + counter)
async function makeSaleNumber(): Promise<string> {
  const date = new Date().toISOString().slice(0,10).replace(/-/g,'');
  const count = await Sale.countDocuments({ saleNumber: new RegExp(`^S-${date}`) });
  return `S-${date}-${String(count+1).padStart(4,'0')}`;
}

/**
 * @desc   Create a new sale
 * @route  POST /api/v1/sales
 * @access private(seller)
 */
export const createSaleCtrl = asyncHandler(async (req: Request, res: Response) => {
  const { clientId, items, date } = req.body;
  /** {  
    "clientId": "...",  
    "items": [ … ],  
    "date": "2025-07-14T10:00:00Z"  
  } */
  const seller = req.user!._id;

  // Client must belong to this seller
  const client = await Client.findOne({ _id: clientId, seller });
  if (!client) throw createError(404, 'Client not found');

  const deliveryMan = client.deliveryMan;
  if (!deliveryMan) {
    throw createError(400, 'Client has no assigned delivery person');
  }

  // Validate & compute totals
  let totalAmount = 0;
  const lineItems = [];
  for (let it of items) {
    const p = await Product.findById(it.productId);
    if (!p) throw createError(404, `Product ${it.productId} not found`);

    // compute discount & price
    let discount = 0;
    if (p.discountRule?.minQty! <= it.quantity) discount = p.discountRule!.percent!;
    if (p.globalDiscountPercent) discount += p.globalDiscountPercent;
    const unitPrice = p.unitPrice * (1 - discount/100);
    const total     = unitPrice * it.quantity;
    totalAmount += total;

    // decrement stock
    const upd = await Product.updateOne(
      { _id: p._id, currentStock: { $gte: it.quantity } },
      { $inc: { currentStock: -it.quantity } }
    );
    if (upd.modifiedCount !== 1) {
      throw createError(400, `Insufficient stock for product ${p._id}`);
    }

    lineItems.push({ productId: p._id, soldBy: it.soldBy, quantity: it.quantity, discount, unitPrice, total });
  }

  // Sale number
  const saleNumber = await makeSaleNumber();

  // Create
  const sale = await Sale.create({
    saleNumber,
    client: clientId,
    seller,
    deliveryMan,
    items: lineItems,
    totalAmount,
    netAmount: totalAmount,
    date
  });

  // Increment client.numberOfOrders
  client.numberOfOrders++;
  await client.save();

  // (optionally) Generate invoice PDF and attach URL
  // sale.invoiceUrl = await generateInvoicePDF(sale);
  // await sale.save();
  res.status(201).json(sale);
});

/**
 * @desc   record returns/payment
 * @route  PATCH /api/v1/sales/:id
 * @access private(delivery)
 */
export const updateSaleCtrl = asyncHandler(async (req: Request, res: Response) => {
  const sale = await Sale.findById(req.params.id);
  if (!sale) throw createError(404, 'Sale not found');

  // 1) Update deliveryStatus
  if (req.body.deliveryStatus) {
    sale.deliveryStatus = req.body.deliveryStatus;
  }

  // 2) Process returns only after delivered
  if (req.body.return?.returnItems) {
    if (sale.deliveryStatus !== 'delivered') {
      throw createError(400, 'Cannot record returns before marking delivered');
    }

    // Build new returnItems array from original items
    const newReturns = (req.body.return.returnItems as any[]).map(ret => {
      const orig = sale.items.find(it => it.productId.toString() === ret.productId);
      if (!orig) throw createError(400, `Item ${ret.productId} not in original sale`);
      return {
        productId: orig.productId,
        soldBy:    orig.soldBy,
        quantity:  ret.quantity,
        discount:  orig.discount,
        unitPrice: orig.unitPrice,
        total:     orig.unitPrice * ret.quantity
      };
    });

    // Replenish stock for each returned line
    for (let it of newReturns) {
      await Product.updateOne(
        { _id: it.productId },
        { $inc: { currentStock: it.quantity } }
      );
    }

    sale.return.returnItems = newReturns;
    // Recompute returnTotal from line totals
    sale.return.returnTotal = newReturns.reduce((sum, it) => sum + it.total, 0);
  }

  // 3) Global returns
  if (typeof req.body.returnGlobal === 'number') {
    sale.returnGlobal = req.body.returnGlobal;
  }

  // 4) Payment updates
  if (req.body.paymentType) {
    sale.paymentType = req.body.paymentType;
  }
  if (req.body.ammoutPaid && typeof req.body.ammountPaid === 'number') {
    const newPaid = sale.ammountPaid + req.body.ammountPaid;
    if (newPaid > sale.netAmount) {
      throw createError(400, 'Amount paid cannot exceed net amount');
    }
    sale.ammountPaid = newPaid;
  }

  // 5) Recompute netAmount
  sale.netAmount = sale.totalAmount 
    - sale.return.returnTotal 
    - sale.returnGlobal;

  await sale.save();
  res.status(200).json(sale);
});

// GET /api/v1/sales?
//   page=2&
//   limit=5&
//   status=delivered&
//   clientId=507f1f…&
//   from=2025-07-01&
//   to=2025-07-13
/**
 * @desc   Get sales (filter by seller or delivery man)
 * @route  GET /api/v1/sales
 * @access private(seller|delivery)
 */
export const getSalesCtrl = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const {
    page:   pageStr,
    limit:  limitStr,
    status,
    clientId,
    from,    // ISO date string
    to       // ISO date string
  } = req.query as Record<string, string>;

  // 1) Pagination defaults
  const page  = Math.max(1, parseInt(pageStr, 10) || 1);
  const limit = Math.max(1, parseInt(limitStr, 10) || 10);
  const skip  = (page - 1) * limit;

  // 2) Build filter
  const filter: any = {};
  if (user.role === 'seller')   filter.seller       = user._id;
  if (user.role === 'delivery') filter.deliveryMan  = user._id;
  if (status)                    filter.deliveryStatus = status;
  if (clientId)                  filter.client       = clientId;

  // Date range on sale.date
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = new Date(from);
    if (to)   filter.date.$lte = new Date(to);
  }

  // 3) Count total matching
  const total = await Sale.countDocuments(filter);

  // 4) Fetch page
  const data = await Sale.find(filter)
    .populate('client','name clientNumber')
    .populate('items.productId','name')
    .sort('-date')
    .skip(skip)
    .limit(limit)
    .lean();

  // 5) Meta
  const totalPages = Math.ceil(total / limit);

  res.status(200).json({
    data,
    meta: { total, page, limit, totalPages }
  });
});

/**
 * @desc   Get sale by id (filter by seller or delivery man)
 * @route  GET /api/v1/sales/:id
 * @access private(seller|delivery)
 */
export const getSaleByIdCtrl = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const filter: any = {};
  filter.id = req.params.id;
  if (user.role === 'seller') filter.seller = user._id;
  if (user.role === 'delivery') filter.deliveryMan = user._id;
  const sale = await Sale.findOne(filter)
    .populate('client','name clientNumber')
    .populate('items.productId','name')
    .sort('-date');
  res.status(200).json(sale);
});