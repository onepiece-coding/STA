import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import createError from 'http-errors';
import Sale from '../models/Sale.js';
import Client from '../models/Client.js';
import Product from '../models/Product.js';
import Supply from '../models/Supply.js';
// import { generateInvoicePDF } from '../utils/invoice.js'; // optional

interface SaleItemDto {
  productId: string;
  soldBy: 'unit' | 'carton';
  quantity: number;
}

interface CreateSaleDto {
  clientId: string;
  date?: string;
  items: SaleItemDto[];
}

// Utility to build a unique saleNumber (date + counter)
async function makeSaleNumber(): Promise<string> {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const count = await Sale.countDocuments({
    saleNumber: new RegExp(`^S-${date}`),
  });
  return `S-${date}-${String(count + 1).padStart(4, '0')}`;
}

/**
 * @desc   Create a new sale
 * @route  POST /api/v1/sales
 * @access private(seller)
 */
export const createSaleCtrl = asyncHandler(
  async (req: Request<{}, {}, CreateSaleDto>, res: Response) => {
    const { clientId, items, date } = req.body;
    const seller = req.user!._id;

    // Client must belong to this seller
    const client = await Client.findOne({ _id: clientId, seller });
    if (!client) throw createError(404, 'Client not found');

    const productIds = items.map(it => it.productId);
    const products = await Product.find({ _id: { $in: productIds } });

    const prodMap = new Map<string, typeof products[number]>(
      products.map(p => [p.id, p])
    );

    const deliveryMan = client.deliveryMan;
    if (!deliveryMan) {
      throw createError(400, 'Client has no assigned delivery person');
    }

    // Validate & compute totals
    let totalAmount = 0;
    const lineItems = [];
    for (let it of items) {
      const p = prodMap.get(it.productId);
      if (!p) throw createError(404, `Product ${it.productId} not found`);
      if (p.currentStock < it.quantity) {
        throw createError(400, `Insufficient stock for product ${p.name}`);
      }

      // compute discount & price
      let discount = 0;
      if (p.discountRule?.minQty! <= it.quantity)
        discount = p.discountRule!.percent!;
      if (p.globalDiscountPercent) discount += p.globalDiscountPercent;
      const unitPrice = p.unitPrice * (1 - discount / 100);
      const total = unitPrice * it.quantity;
      totalAmount += total;

      lineItems.push({ 
        productId: p._id, soldBy: it.soldBy, quantity: it.quantity,
        discount, unitPrice, total 
      });
    }

    for (let it of lineItems) {
      let remainingToDeduct = it.quantity;
      const supplies = await Supply
        .find({ productId: it.productId, remainingQty: { $gt: 0 } })
        .sort('expiringAt')
        .exec();
  
      for (let sup of supplies) {
        const take = Math.min(sup.remainingQty, remainingToDeduct);
        sup.remainingQty -= take;
        remainingToDeduct -= take;
        await sup.save();
        if (remainingToDeduct === 0) break;
      }

      await Product.updateOne(
        { _id: it.productId },
        { $inc: { currentStock: -it.quantity } }
      );
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
      date,
    });

    // Increment client.numberOfOrders
    client.numberOfOrders++;
    await client.save();

    // (optionally) Generate invoice PDF and attach URL
    // sale.invoiceUrl = await generateInvoicePDF(sale);
    // await sale.save();
    res.status(201).json(sale);
  },
);

/**
 * @desc   record returns/payment
 * @route  PATCH /api/v1/sales/:id
 * @access private(delivery)
 */
export const updateSaleCtrl = asyncHandler(
  async (req: Request, res: Response) => {
    const sale = await Sale.findById(req.params.id);
    if (!sale) throw createError(404, 'Sale not found');

    // 1) Update deliveryStatus
    if (req.body.deliveryStatus) {
      sale.deliveryStatus = req.body.deliveryStatus;
    }

    // 2) Process returns only after delivered
    if (req.body.return?.returnItems) {
      if (sale.deliveryStatus !== 'delivered') {
        throw createError(
          400,
          'Cannot record returns before marking delivered',
        );
      }

      // Build new returnItems array from original items
      const newReturns = (req.body.return.returnItems as any[]).map((ret) => {
        const orig = sale.items.find(
          (it) => it.productId.toString() === ret.productId,
        );
        if (!orig)
          throw createError(400, `Item ${ret.productId} not in original sale`);
        return {
          productId: orig.productId,
          soldBy: orig.soldBy,
          quantity: ret.quantity,
          discount: orig.discount,
          unitPrice: orig.unitPrice,
          total: orig.unitPrice * ret.quantity,
        };
      });

      // Replenish stock for each returned line
      for (let it of newReturns) {
        let ToAdd = it.quantity;
        const supplies = await Supply
          .find({ productId: it.productId})
          .sort('-expiringAt')
          .exec();
    
        for (let sup of supplies) {
          const take = Math.min((sup.quantity - sup.remainingQty), ToAdd);
          sup.remainingQty += take;
          ToAdd -= take;
          await sup.save();
          if (ToAdd === 0) break;
        }

        await Product.updateOne(
          { _id: it.productId },
          { $inc: { currentStock: it.quantity } },
        );
      }

      sale.return.returnItems = newReturns;
      // Recompute returnTotal from line totals
      sale.return.returnTotal = newReturns.reduce(
        (sum, it) => sum + it.total,
        0,
      );
    }

    // 3) Global returns
    if (typeof req.body.returnGlobal === 'number') {
      sale.returnGlobal = req.body.returnGlobal;
    }

    // 4) Payment updates
    if (req.body.paymentMethod) {
      sale.paymentMethod = req.body.paymentMethod;
    }
    if (req.body.amountPaid && typeof req.body.amountPaid === 'number') {
      const newPaid = sale.amountPaid + req.body.amountPaid;
      if (newPaid > sale.netAmount) {
        throw createError(400, 'Amount paid cannot exceed net amount');
      }
      sale.amountPaid = newPaid;
    }

    // 5) Recompute netAmount
    sale.netAmount =
      sale.totalAmount - sale.return.returnTotal - sale.returnGlobal;

    await sale.save();
    res.status(200).json(sale);
  },
);

// GET /api/v1/sales?
//   page=2&
//   limit=5&
//   status=delivered&
//   clientId=507f1f…&
//   from=2025-07-14T00:00:00Z&
//   to=2025-07-14T23:59:59Z
/**
 * @desc   Get sales (filter by seller or delivery man)
 * @route  GET /api/v1/sales
 * @access private(seller|delivery|instant)
 */
export const getSalesCtrl = asyncHandler(
  async (req: Request, res: Response) => {
    const user = req.user!;
    const {
      page: pageStr,
      limit: limitStr,
      status,
      clientId,
      from, // ISO date string
      to, // ISO date string
    } = req.query as Record<string, string>;

    if (!from || !to) {
      throw createError(400, '`from` and `to` query parameters are both required');
    }

    // Pagination defaults
    const page = Math.max(1, parseInt(pageStr, 10) || 1);
    const limit = Math.max(1, parseInt(limitStr, 10) || 10);
    const skip = (page - 1) * limit;

    // Build filter
    const filter: any = {};
    if (user.role === 'seller' || user.role === 'instant') filter.seller = user._id;
    if (user.role === 'delivery') filter.deliveryMan = user._id;
    if (status) filter.deliveryStatus = status;
    if (clientId) filter.client = clientId;

    // Date range on sale.date
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) filter.date.$lte = new Date(to);
    }

    // Count total matching
    const total = await Sale.countDocuments(filter);

    // Fetch page
    const data = await Sale.find(filter)
      .populate('client', 'name clientNumber')
      .populate('items.productId', 'name')
      .sort('-date')
      .skip(skip)
      .limit(limit)
      .lean();

    // Meta
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      data,
      meta: { total, page, limit, totalPages },
    });
  },
);

/**
 * @desc   Get sale by id (filter by seller or delivery man)
 * @route  GET /api/v1/sales/:id
 * @access private(seller|delivery)
 */
export const getSaleByIdCtrl = asyncHandler(
  async (req: Request, res: Response) => {
    const user = req.user!;
    const filter: any = {};
    filter._id = req.params.id;
    if (user.role === 'seller' || user.role === 'instant') filter.seller = user._id;
    if (user.role === 'delivery') filter.deliveryMan = user._id;
    const sale = await Sale.findOne(filter)
      .populate('client', 'name clientNumber')
      .populate('items.productId', 'name');
    if (!sale) throw createError(404, 'Sale not found');
    res.status(200).json(sale);
  },
);
