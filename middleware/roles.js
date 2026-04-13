import { ApiError } from '../utils/apiError.js';

export const isOutletManager = (user) => user?.role === 'outlet_manager';
export const isAdmin = (user) => user?.role === 'admin';
export const isSuperAdmin = (user) => user?.role === 'superadmin';

export const blockOutletManager = (req, _res, next) => {
  if (isOutletManager(req.user)) {
    throw new ApiError(403, 'Outlet management access denied');
  }
  next();
};

export const requireAdminOnly = (req, _res, next) => {
  if (!req.user) {
    throw new ApiError(401, 'Unauthorized');
  }
  if (!isAdmin(req.user)) {
    throw new ApiError(403, 'Access denied');
  }
  next();
};
