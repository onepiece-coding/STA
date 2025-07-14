import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import createError from "http-errors";
import Product from '../models/Product.js';
import {
  cloudinaryUploadImage,
  cloudinaryRemoveImage
} from '../utils/cloudinary.js';


interface MulterReq extends Request {
  file?: Express.Multer.File;
}

/**-----------------------------------
 * @desc   Create Product
 * @route  /api/v1/product
 * @method POST
 * @access private(admin)
--------------------------------------*/
export const createProductCtrl = asyncHandler(
  async (req: MulterReq, res: Response) => {
    let prod = await Product.findOne({ name: req.body.name });
    if (prod) throw createError(409, "Product already exist");
    if (req.file) {
      const uploadRes = await cloudinaryUploadImage(req.file.buffer, { folder: 'products' });
      req.body.pictureUrl = { url: uploadRes.secure_url, publicId: uploadRes.public_id };
    }
    prod = await Product.create(req.body);
    res.status(201).json(prod);
  }
);

/**-----------------------------------
 * @desc   Get Products
 * @route  /api/v1/products
 * @method GET
 * @access private
--------------------------------------*/
export const getProductsCtrl = asyncHandler(
  async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const category = req.query.category as string | undefined;
    const search = req.query.search as string | undefined;

    const filter: Record<string, any> = {};
    if (category) filter.categoryId = category;
    if (search) filter.name = { $regex: search, $options: 'i' };

    const total = await Product.countDocuments(filter);

    const data = await Product.find(filter)
      .populate('categoryId', 'name')
      .skip((page - 1) * limit)
      .limit(limit);

    // Prepare pagination metadata
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
 * @desc    Get a single product by ID
 * @route   GET /api/v1/products/:id
 * @access  private
 */
export const getProductByIdCtrl = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const product = await Product.findById(id)
    .populate('categoryId', 'name')
    .lean();

  if (!product) {
    throw createError(404, 'Product not found');
  }

  res.status(200).json(product);
});

/**
 * @desc    List all products with a global discount
 * @route   GET /api/v1/products/discounts
 * @access  private(admin, seller)
 */
export const getDiscountedProductsCtrl = asyncHandler(async (req: Request, res: Response) => {
  // Pagination
  const page  = Math.max(1, parseInt(req.query.page as string, 10) || 1);
  const limit = Math.max(1, parseInt(req.query.limit as string, 10) || 10);
  const skip  = (page - 1) * limit;

  // Only products where globalDiscountPercent > 0
  const filter = { globalDiscountPercent: { $gt: 0 } };

  // Total count
  const total = await Product.countDocuments(filter);

  // Fetch page, including category name
  const data = await Product.find(filter)
    .populate('categoryId', 'name')
    .skip(skip)
    .limit(limit)
    .lean();

  const totalPages = Math.ceil(total / limit);

  res.status(200).json({
    data,
    meta: { total, page, limit, totalPages }
  });
});


/**--------------------------------------
 * @desc    Update Product
 * @route   /api/v1/product/:id
 * @method  PATCH
 * @access  private (admin)
-----------------------------------------*/
export const updateProductCtrl = asyncHandler(
  async (req: MulterReq, res: Response) => {
    const { id } = req.params;

    const prod = await Product.findById(id);
    if (!prod) throw createError(404, 'Product not found');

    if (req.file) {
      if (prod.pictureUrl?.publicId) {
        await cloudinaryRemoveImage(prod.pictureUrl.publicId);
      }
      const uploadRes = await cloudinaryUploadImage(req.file.buffer, {
        folder: 'products'
      });
      prod.pictureUrl = {
        url: uploadRes.secure_url,
        publicId: uploadRes.public_id
      };
    }

    const updates: Partial<typeof prod> = {};
    const { name, categoryId, unitPrice, discountRule, globalDiscountPercent } = req.body;
    if (name) updates.name = name;
    if (categoryId) updates.categoryId = categoryId;
    if (unitPrice) updates.unitPrice = unitPrice;
    if (discountRule) updates.discountRule = discountRule;
    if (globalDiscountPercent) updates.globalDiscountPercent = globalDiscountPercent;
    if (req.file) {
      updates.pictureUrl = prod.pictureUrl;
    }

    const updated = await Product.findByIdAndUpdate(id, updates, { new: true });
    res.status(200).json(updated);
  }
);

/**
 * @desc   Manually adjust a product’s stock
 * @route  POST /api/v1/products/adjust
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

/**-----------------------------------
 * @desc   Delete product
 * @route  /api/v1/products/:id
 * @method DELETE
 * @access private(admin)
--------------------------------------*/
export const deleteProductCtrl = asyncHandler(async (req:Request, res:Response):Promise<void> => {
  const product = await Product.findById(req.params.id);
  if(!product) throw createError(404, "Product not found");
  if (product.pictureUrl?.publicId) {
    await cloudinaryRemoveImage(product.pictureUrl.publicId);
  }
  await Product.findByIdAndDelete(req.params.id);
  res.status(200).json({ message: "Product deleted successfully" });
})