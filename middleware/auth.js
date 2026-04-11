import jwt from 'jsonwebtoken';

import { Staff } from '../model/staff.js';
import User from '../model/user.js';
import { ApiError } from '../utils/apiError.js';
import { STAFF_ROLE } from '../utils/constants.js';

import { blockExpiredSubscription } from './checkSubscription.js';

const subscriptionAllowedRoutes = [
  '/me',
  '/renew-subscription',
  '/change-password',
  '/reset-password',
  '/create-subscription',
  '/verify-subscription',
  '/verify-renew-subscription',
  '/check-email',
  '/plans',
];
export const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

/**
 * isPublic is used to allow access to route without token but with adminId in body
 * used to block when its subscription expired but allow access to subscription page
 * @param {*} res
 * @param {*} next
 * @param {*} isPublic
 * @returns
 */
export const tokenVerification = async (req, res, next, isPublic = false) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token && !isPublic) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = isPublic
      ? { id: req.body.adminId ?? req.params.adminId }
      : jwt.verify(token, process.env.JWT_SECRET);

    if (decoded?.role.includes(STAFF_ROLE)) {
      const staff = await Staff.findById(decoded.id);
      if (!staff) {
        return next(new ApiError(401, 'User not found'));
      }
      if (!staff.isActive) {
        return res.status(403).json({
          message: 'Your staff account is inactive. Please contact admin.',
        });
      }

      const ownerAdmin = await User.findById(staff.adminId);
      if (!ownerAdmin) {
        return next(new ApiError(401, 'User not found'));
      }
      if (!ownerAdmin.isActive) {
        return res.status(403).json({
          message: 'Your account is inactive. Please purchase subscription',
        });
      }

      req.user = staff;
      req.ownerAdmin = ownerAdmin;
      req.effectiveAdminId = ownerAdmin._id;

      if (!subscriptionAllowedRoutes.includes(req.path)) {
        return blockExpiredSubscription(req, res, next);
      }

      return next();
    }

    const user = await User.findById(decoded.id);

    if (!user) {
      return next(new ApiError(401, 'User not found'));
    }
    if (!user.isActive) {
      return res.status(403).json({
        message: 'Your account is inactive. Please purchase subscription',
      });
    }

    req.user = user;
    req.ownerAdmin = user;
    req.effectiveAdminId = user._id;

    if (
      user.role !== 'superadmin' &&
      !subscriptionAllowedRoutes.includes(req.path)
    ) {
      return blockExpiredSubscription(req, res, next);
    }

    return next();
  } catch (_error) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
};
