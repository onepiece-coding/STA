import { Request, Response, NextFunction } from 'express';
import asyncHandler from 'express-async-handler';
import createError from "http-errors";
import Category from '../models/Category.js';

/**-----------------------------------
 * @desc   Create Category
 * @route  /api/v1/categories
 * @method POST
 * @access private(admin)
--------------------------------------*/
export const createCategoryCtrl = asyncHandler(async (req:Request, res:Response, next:NextFunction):Promise<void> => {
  let cat = await Category.findOne({ name: req.body.name });
  if (cat) throw createError(409, "Category already exist");
  cat = await Category.create(req.body);
  res.status(201).json(cat);
})

/**-----------------------------------
 * @desc   Get Category
 * @route  /api/v1/categories/:id
 * @method POST
 * @access private(admin)
--------------------------------------*/
export const getCategoryCtrl = asyncHandler(async (req:Request, res:Response, next:NextFunction):Promise<void> => {
  const list = await Category.find();
  res.status(200).json(list);
})

/**-----------------------------------
 * @desc   Delete Category
 * @route  /api/v1/category/:id
 * @method DELETE
 * @access private(admin)
--------------------------------------*/
export const deleteCategoryCtrl = asyncHandler(async (req:Request, res:Response, next:NextFunction):Promise<void> => {
  const category = await Category.findByIdAndDelete(req.params.id);
  if(!category) throw createError(404, "Category not found");
  res.status(200).json({ message: "Category deleted successfully" });
})