const superAdminOnly = (req, res, next) => {
  if (!req.user || ![ "superadmin"].includes(req.user.role)) {
    return res.status(403).json({
      message: "Super Admin access only",
    });
  }
  next();
};
export default superAdminOnly;
