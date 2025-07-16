import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import createError from 'http-errors';
import Client from '../models/Client.js';
import {
  cloudinaryUploadImage,
  cloudinaryRemoveImage,
} from '../utils/cloudinary.js';
import Sector from '../models/Sector.js';
import User from '../models/User.js';

interface MulterReq extends Request {
  file?: Express.Multer.File;
}

function makeClientNumber(): string {
  // for example: “CL-” + timestamp + 3‑digit random
  const ts = Date.now();
  const rnd = Math.floor(Math.random() * 900) + 100;
  return `CL-${ts}-${rnd}`;
}

/**
 * @desc   Create a new client
 * @route  POST /api/v1/clients
 * @access private(seller)
 */
export const createClientCtrl = asyncHandler(
  async (req: MulterReq, res: Response) => {
    const {
      name,
      location,
      typeOfBusiness,
      city,
      sector,
      phoneNumber,
      deliveryMan,
    } = req.body;
    const sellerId = req.user!._id.toString();

    const seller = await User.findById(sellerId).select('sectors').lean();
    if (!seller) throw createError(404, 'Seller not found');

    if (!seller.sectors?.map(String).includes(sector)) {
      throw createError(
        403,
        'Cannot create client outside your assigned sectors',
      );
    }

    if (deliveryMan) {
      const dl = await User.findOne({
        _id: deliveryMan,
        role: 'delivery',
        seller: sellerId,
      })
        .select('deliverySectors')
        .lean();

      if (!dl) {
        throw createError(403, 'Specified delivery man is not assigned to you');
      }

      if (!dl.deliverySectors!.map(String).includes(sector)) {
        throw createError(
          403,
          'Delivery man is not authorized to serve that sector',
        );
      }
    }

    if (
      await Client.exists({
        name: { $regex: `^${name}$`, $options: 'i' },
        seller: sellerId,
      })
    ) {
      throw createError(409, 'Client name already in use');
    }

    let clientNumber: string;
    do {
      clientNumber = makeClientNumber();
    } while (await Client.exists({ clientNumber }));

    const data: any = {
      clientNumber,
      name,
      location,
      typeOfBusiness,
      city,
      sector,
      phoneNumber,
      seller: sellerId,
      deliveryMan,
    };

    if (req.file) {
      const uploadRes = await cloudinaryUploadImage(req.file.buffer, {
        folder: 'clients',
      });
      data.placePicUrl = {
        url: uploadRes.secure_url,
        publicId: uploadRes.public_id,
      };
    }

    const client = await Client.create(data);
    res.status(201).json(client);
  },
);

// GET /api/v1/clients?cityId=5e456…&sectorId=5f123…
/**
 * @desc   Get all clients for this seller/delivery
 * @route  GET /api/v1/clients
 * @access private(seller/delivery)
 */
export const getClientsCtrl = asyncHandler(
  async (req: Request, res: Response) => {
    const user = req.user!;

    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const sectorId = req.query.sectorId as string | undefined;
    const cityId = req.query.cityId as string | undefined;
    const clientNumber = req.query.clientNumber as string | undefined;

    if (!sectorId && !cityId) {
      throw createError(400, 'Please enter a sector or a city');
    }

    const filter: any = {};
    if (user.role === 'seller') {
      filter.seller = user._id;
    } else if (user.role === 'delivery') {
      filter.deliveryMan = user._id;
    }

    if (sectorId) {
      filter.sector = sectorId;
    }

    if (cityId) {
      const sectors = await Sector.find({ city: cityId }).select('_id').lean();
      const sectorIds = sectors.map((s) => s._id);
      filter.sector = { $in: sectorIds };
    }

    if(clientNumber){
      filter.clientNumber = req.params.clientNumber;
    }

    const total = await Client.countDocuments(filter);

    const data = await Client.find(filter)
      .populate('sector', 'name')
      .populate('seller', 'username')
      .populate('deliveryMan', 'username')
      .populate('city', 'name')
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
        totalPages,
      },
    });
  },
);

/**
 * @desc   Get clients by Id
 * @route  GET /api/v1/clients
 * @access private(seller/delivery)
 */
export const getClientByIdCtrl = asyncHandler(
  async (req: Request, res: Response) => {
    const user = req.user!;
    const clientId = req.params.id;

    const filter: any = { _id: clientId };
    if (user.role === 'seller') {
      filter.seller = user._id;
    } else if (user.role === 'delivery') {
      filter.deliveryMan = user._id;
    }

    const client = await Client.findOne(filter)
      .populate('sector', 'name')
      .populate('seller', 'username')
      .populate('deliveryMan', 'username')
      .populate('city', 'name')
      .lean();

    if (!client) {
      throw createError(404, 'Client not found');
    }

    res.status(200).json(client);
  },
);

/**
 * @desc   Update client (including re‑uploading placePic)
 * @route  PATCH /api/v1/clients/:id
 * @access private(seller)
 */
export const updateClientCtrl = asyncHandler(
  async (req: MulterReq, res: Response) => {
    const client = await Client.findOne({
      _id: req.params.id,
      seller: req.user!._id,
    });
    if (!client) throw createError(404, 'Client not found');

    // Update fields
    [
      'name',
      'location',
      'typeOfBusiness',
      'city',
      'sector',
      'phoneNumber',
      'deliveryMan',
    ].forEach((f) => {
      if (req.body[f]) (client as any)[f] = req.body[f];
    });

    // New picture?
    if (req.file) {
      if (client.placePicUrl?.publicId) {
        await cloudinaryRemoveImage(client.placePicUrl.publicId);
      }
      const up = await cloudinaryUploadImage(req.file.buffer, {
        folder: 'clients',
      });
      client.placePicUrl = { url: up.secure_url, publicId: up.public_id };
    }

    await client.save();
    res.status(200).json(client);
  },
);

/**
 * @desc   Delete a client
 * @route  DELETE /api/v1/clients/:id
 * @access private(seller)
 */
export const deleteClientCtrl = asyncHandler(
  async (req: Request, res: Response) => {
    const client = await Client.findOneAndDelete({
      _id: req.params.id,
      seller: req.user!._id,
    });
    if (!client) throw createError(404, 'Client not found');

    // Remove stored picture
    if (client.placePicUrl?.publicId) {
      await cloudinaryRemoveImage(client.placePicUrl.publicId);
    }
    res.status(200).json({ message: 'Client deleted successfully' });
  },
);
