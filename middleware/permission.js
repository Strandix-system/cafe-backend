import { ApiError } from '../utils/apiError.js';
import { STAFF_ROLE } from '../utils/constants.js';
import { hasValidStaffRole } from '../utils/utils.js';

export const allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new ApiError(401, 'Unauthorized');
    }

    if (req.user.role === 'superadmin') {
      return next();
    }

    if (!roles.includes(req.user.role)) {
      throw new ApiError(403, 'Access denied');
    }

    next();
  };
};

export const allowStaffTypes = (...staffTypes) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new ApiError(401, 'Unauthorized');
    }

    if (!hasValidStaffRole(req.user.role)) {
      return next();
    }

    if (!staffTypes.includes(req.user.role)) {
      throw new ApiError(403, 'Access denied');
    }

    next();
  };
};

// const roles = {
//     superadmin: ['create', 'read', 'update', 'delete', 'download', 'upload'],
//     admin: ['create', 'read', 'update', 'delete', 'download', 'upload'],
//     taxidispatcher: ['create', 'read', 'update', 'download', 'upload'],
//     createOnly: ['create', 'read', 'download', 'upload'],
//     readOnly: ['read', 'download'],
// };

// function hasPermission(permissionName = 'all') {
//     return function (req, res, next) {
//         const currentUserRole = req.user.role;

//         if (roles[currentUserRole].includes(permissionName) || req.user.role === 'superadmin') {
//             next();
//         } else {
//             return res.status(403).json({
//                 success: false,
//                 message: 'Access denied : you are not granted permission.',
//                 result: null
//             });
//         };
//     };
// };

// export {
//     hasPermission,
//     roles
// };
