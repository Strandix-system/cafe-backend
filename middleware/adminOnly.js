import { ApiError } from '../utils/apiError.js';

const superAdminOnly = (req, res, next) => {
  if (!req.user || !['superadmin'].includes(req.user.role)) {
    throw new ApiError(403, 'Super Admin access only');
  }

  next();
};

export default superAdminOnly;
