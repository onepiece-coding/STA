import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Sale from '../models/Sale.js';
import mongoose from 'mongoose';

export const getStatsCtrl = asyncHandler(
  async (req: Request, res: Response) => {
    const user = req.user!;
    const { from, to, sellerId } = req.query as {
      from?: string;
      to?: string;
      sellerId?: string;
    };

    // 1) Build match filter
    const match: any = { deliveryStatus: 'delivered' };
    if (from || to) {
      match.date = {};
      if (from) match.date.$gte = new Date(from);
      if (to) match.date.$lte = new Date(to);
    }
    if (user.role === 'seller' || user.role === 'instant') {
      // sellers only see their own sales
      match.seller = user._id;
    } else if (sellerId) {
      // admin may filter by specific seller
      match.seller = new mongoose.Types.ObjectId(sellerId);
    }

    // 2) Aggregate
    const [agg] = await Sale.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalNet: { $sum: '$netAmount' }, // chiffre d'affaires
          totalVentes: { $sum: '$totalAmount' }, // ventes before returns
          sumReturnItems: { $sum: '$return.returnTotal' }, // line‐item returns
          sumReturnGlobal: { $sum: '$returnGlobal' }, // ad‑hoc returns
          totalPaid: { $sum: '$amountPaid' }, // what clients have paid
        },
      },
      {
        $project: {
          _id: 0,
          chiffreAffaire: '$totalNet',
          ventes: '$totalVentes',
          retour: { $add: ['$sumReturnItems', '$sumReturnGlobal'] },
          reste: { $subtract: ['$totalNet', '$totalPaid'] },
        },
      },
    ]);

    // 3) Default zeros if no docs matched
    const stats = agg ?? {
      chiffreAffaire: 0,
      ventes: 0,
      retour: 0,
      reste: 0,
    };

    res.status(200).json(stats);
  },
);
