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

    // 1) Load the seller’s sectors
    const seller = await User.findById(sellerId).select('sectors').lean();
    if (!seller) throw createError(404, 'Seller not found');

    // 2) Prevent clients outside seller’s sectors
    if (!seller.sectors?.map(String).includes(sector)) {
      throw createError(
        403,
        'Cannot create client outside your assigned sectors',
      );
    }

    // 3) If deliveryMan is provided, ensure they belong to this seller
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

      // make sure this client’s sector is in his deliverySectors
      if (!dl.deliverySectors!.map(String).includes(sector)) {
        throw createError(
          403,
          'Delivery man is not authorized to serve that sector',
        );
      }
    }

    // 4) Prevent duplicate client names under this seller
    if (
      await Client.exists({
        name: { $regex: `^${name}$`, $options: 'i' },
        seller: sellerId,
      })
    ) {
      throw createError(409, 'Client name already in use');
    }

    // 5) Generate unique clientNumber
    let clientNumber: string;
    do {
      clientNumber = makeClientNumber();
    } while (await Client.exists({ clientNumber }));

    // 6) Assemble payload
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

    // 7) Optional storefront picture
    if (req.file) {
      const uploadRes = await cloudinaryUploadImage(req.file.buffer, {
        folder: 'clients',
      });
      data.placePicUrl = {
        url: uploadRes.secure_url,
        publicId: uploadRes.public_id,
      };
    }

    // 8) Save & respond
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
    const { sectorId, cityId } = req.query as {
      sectorId?: string;
      cityId?: string;
    };

    // 1) Base filter by role
    const filter: any = {};
    if (user.role === 'seller') {
      filter.seller = user._id;
    } else if (user.role === 'delivery') {
      filter.deliveryMan = user._id;
    } else {
      // Admins might see all clients
    }

    // 2) Filter by specific sector
    if (sectorId) {
      filter.sector = sectorId;
    }

    // 3) Filter by city: find all sectors in that city
    if (cityId) {
      const sectors = await Sector.find({ city: cityId }).select('_id').lean();
      const sectorIds = sectors.map((s) => s._id);
      filter.sector = { $in: sectorIds };
    }

    // 4) Fetch & populate
    const clients = await Client.find(filter)
      .populate('sector', 'name')
      .populate('seller', 'username')
      .populate('deliveryMan', 'username')
      .lean();

    res.status(200).json(clients);
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

    // Build base filter by role
    const filter: any = { _id: clientId };
    if (user.role === 'seller') {
      filter.seller = user._id;
    } else if (user.role === 'delivery') {
      filter.deliveryMan = user._id;
    }

    // Fetch the single client
    const client = await Client.findOne(filter)
      .populate('sector', 'name')
      .populate('seller', 'username')
      .populate('deliveryMan', 'username')
      .lean();

    if (!client) {
      // either not found or not permitted
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
