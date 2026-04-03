import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

import User from '../../model/user.js';
import { ApiError } from '../../utils/apiError.js';
import { sendResetEmail } from '../../utils/email.js';
dotenv.config();

const authService = {
  register: async (data) => {
    const { email, password, role = 'superadmin' } = data;

    const exists = await User.findOne({ email });
    if (exists) {
      throw new ApiError(409, 'User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password: hashedPassword,
      role,
    });

    return {
      id: user._id,
      email: user.email,
      role: user.role,
    };
  },

  login: async (data) => {
    const { email, phoneNumber, password } = data;

    if ((!email && !phoneNumber) || !password) {
      throw new ApiError(400, 'Email or phoneNumber and password are required');
    }
    const user = await User.findOne({
      $or: [
        email ? { email } : null,
        phoneNumber ? { phoneNumber } : null,
      ].filter(Boolean),
    }).select('+password');

    if (!user) {
      throw new ApiError(401, 'Invalid credentials');
    }
    if (!user.isActive) {
      throw new ApiError(
        403,
        'Your account is inactive. Please contact admin.',
      );
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new ApiError(401, 'Invalid credentials');
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
    );
    return {
      token,
      role: user.role,
    };
  },

  logout: async (userId) => {
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, 'User not found');
    user.tokenVersion += 1;
    await user.save();
    return { message: 'Logged out successfully' };
  },

  forgotPassword: async (email) => {
    const user = await User.findOne({ email });
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    const token = jwt.sign(
      { email: user.email, purpose: 'reset-password' },
      process.env.JWT_SECRET,
      { expiresIn: '10m' },
    );
    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;
    await sendResetEmail(user.email, resetLink);
    return true;
  },

  resetPassword: async (token, newPassword) => {
    if (!token) {
      throw new ApiError(400, 'No token provided');
    }

    if (!newPassword) {
      throw new ApiError(400, 'New password is required');
    }
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (_error) {
      throw new ApiError(400, 'Invalid or expired token');
    }

    if (decoded.purpose !== 'reset-password') {
      throw new ApiError(400, 'Invalid reset token');
    }
    const user = await User.findOne({ email: decoded.email }).select(
      '+password',
    );

    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      throw new ApiError(400, 'New password cannot be same as old password');
    }
    user.password = newPassword;
    await user.save();
    return true;
  },

  changePassword: async (adminId, currentPassword, newPassword) => {
    if (!currentPassword || !newPassword) {
      throw new ApiError(400, 'Both current and new password are required');
    }
    const user = await User.findById(adminId).select('+password');
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    if (!user.password) {
      throw new ApiError(400, 'User password not found');
    }
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      throw new ApiError(401, 'Current password is incorrect');
    }
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      throw new ApiError(400, 'New password cannot be same as old password');
    }
    user.password = newPassword;
    await user.save();
    return true;
  },
};

export default authService;
