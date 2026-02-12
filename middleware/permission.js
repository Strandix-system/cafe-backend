export const allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (req.user.role === "superadmin") {
      return next();
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
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