import jwt from "jsonwebtoken";
import User from "../model/user.js";
import { ApiError } from "../utils/apiError.js";

export const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

export const tokenVerification = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      throw new ApiError(401, "No token provided");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);

    if (!user) {
      throw new ApiError(401, "User not found");
    }

    if (!user.isActive) {
      throw new ApiError(403, "Your account is inactive. Please purchase subscription");
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
  }
};
