import { ApiError } from './apiError.js';
import Outlet from '../model/outlet.js';

export const isAdminScopedRole = (role) => ['admin', 'manager'].includes(role);

export const resolveAdminOwnerId = (user, options = {}) => {
  const { allowSuperadmin = false } = options;

  if (!user) {
    throw new ApiError(401, 'Unauthorized');
  }

  if (user.role === 'admin') {
    return user._id;
  }

  if (user.role === 'manager') {
    if (!user.adminId) {
      throw new ApiError(403, 'Manager is not linked to an admin account');
    }

    return user.adminId;
  }

  if (allowSuperadmin && user.role === 'superadmin') {
    return user._id;
  }

  throw new ApiError(403, 'Access denied');
};

export const resolveOutletAccessContext = async (
  user,
  requestedOutletId = null,
  options = {},
) => {
  const {
    requireOutlet = false,
    allowSuperadmin = false,
    requestedAdminId = null,
  } = options;

  if (!user) {
    throw new ApiError(401, 'Unauthorized');
  }

  if (user.role === 'superadmin') {
    if (!allowSuperadmin) {
      throw new ApiError(403, 'Access denied');
    }

    if (!requestedAdminId) {
      throw new ApiError(400, 'adminId is required');
    }

    if (!requestedOutletId) {
      return {
        adminId: requestedAdminId,
        outletId: null,
        outlet: null,
      };
    }

    const outlet = await Outlet.findOne({
      _id: requestedOutletId,
      adminId: requestedAdminId,
    });

    if (!outlet) {
      throw new ApiError(404, 'Outlet not found');
    }

    return {
      adminId: requestedAdminId,
      outletId: outlet._id,
      outlet,
    };
  }

  const adminId = resolveAdminOwnerId(user);

  if (user.role === 'manager') {
    if (!user.outletId) {
      throw new ApiError(403, 'Manager is not linked to an outlet');
    }

    const outlet = await Outlet.findOne({
      _id: user.outletId,
      adminId,
      managerId: user._id,
    });

    if (!outlet) {
      throw new ApiError(404, 'Assigned outlet not found');
    }

    return {
      adminId,
      outletId: outlet._id,
      outlet,
    };
  }

  if (!requestedOutletId) {
    if (!requireOutlet) {
      return {
        adminId,
        outletId: null,
        outlet: null,
      };
    }

    const mainOutlet = await Outlet.findOne({
      adminId,
      isMain: true,
    });

    if (!mainOutlet) {
      throw new ApiError(404, 'Main outlet not found');
    }

    return {
      adminId,
      outletId: mainOutlet._id,
      outlet: mainOutlet,
    };
  }

  const outlet = await Outlet.findOne({
    _id: requestedOutletId,
    adminId,
  });

  if (!outlet) {
    throw new ApiError(404, 'Outlet not found');
  }

  return {
    adminId,
    outletId: outlet._id,
    outlet,
  };
};
