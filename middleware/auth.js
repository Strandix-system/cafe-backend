import jwt from "jsonwebtoken";
import User from "../model/user.js";
import { blockExpiredSubscription } from "./checkSubscription.js";

const subscriptionAllowedRoutes = [
  "/me",
  "/renew-subscription",
  "/change-password",
  "/reset-password",
  "/create-subscription",
  "/verify-subscription",
  "/verify-renew-subscription",
  "/check-email",
  "/plans"
];
export const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
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
    const token = req.headers.authorization?.split(" ")[1];
    if (!token && !isPublic) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = isPublic ? { id: req.body.adminId || req.params.adminId } : jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded token:", decoded);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    if (!user.isActive) {
      return res.status(403).json({
        message: "Your account is inactive. Please purchase subscription",
      });
    }
    req.user = user;
    if (user.role !== "superadmin" && !subscriptionAllowedRoutes.includes(req.path)) {
      await blockExpiredSubscription(req, res, next);
    }

    next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
  }
};
