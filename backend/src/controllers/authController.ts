import { Request, Response, NextFunction } from 'express';
import asyncHandler from 'express-async-handler';
import createError from 'http-errors';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**-------------------------------------------
 * @desc   Login User
 * @route  /api/v1/auth/login
 * @method POST
 * @access public
----------------------------------------------*/
export const loginUserCtrl = asyncHandler(
  async (req: Request, res: Response) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user || !(await user.comparePassword(password))) {
      throw createError(401, 'Invalid credentials');
    }
    const token = jwt.sign(
      { id: user!._id, role: user!.role },
      process.env.JWT_SECRET!,
      { expiresIn: '8h' },
    );
    res.status(200).json({ accessToken: token });
  },
);

/**-------------------------------------------
 * @desc   Get Current User
 * @route  /api/v1/auth/current-user
 * @method GET
 * @access private
----------------------------------------------*/
export const getCurrentUser = asyncHandler(
  async (req: Request, res: Response) => {
    const user = await User.findById(req.user._id, '-password')
      .populate('sectors', '_id name')
      .populate('deliverySectors', '_id name');
    res.status(200).json(user);
  },
);

/**
 * @desc    Change logged‑in user's password
 * @route   POST /api/v1/auth/change-password
 * @access  private (any authenticated user)
 */
export const changePasswordCtrl = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!._id;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // 1) basic validations
    if (!currentPassword || !newPassword || !confirmPassword) {
      throw createError(
        400,
        'currentPassword, newPassword, and confirmPassword are required',
      );
    }
    if (newPassword !== confirmPassword) {
      throw createError(400, 'newPassword and confirmPassword do not match');
    }
    if (newPassword.length < 6) {
      throw createError(400, 'newPassword must be at least 6 characters');
    }

    // 2) fetch user with password
    const user = await User.findById(userId).select('+password');
    if (!user) throw createError(404, 'User not found');

    // 3) verify currentPassword
    const ok = await user.comparePassword(currentPassword);
    if (!ok) throw createError(401, 'Current password is incorrect');

    if (currentPassword === newPassword)
      throw createError(400, 'You entered the same old password');

    // 4) assign and save
    user.password = newPassword;
    await user.save(); // pre-save hook will hash

    // 5) respond
    res.status(200).json({ message: 'Mot de passe modifié avec succès' });
  },
);
