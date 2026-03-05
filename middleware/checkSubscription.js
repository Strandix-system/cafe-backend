import User from "../model/user.js";

const checkSubscription = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return next();
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    if (
      user.subscriptionEndDate &&
      new Date() > user.subscriptionEndDate
    ) {
      user.subscriptionStatus = "expired";
      await user.save();

      return res.status(403).json({
        success: false,
        message: "Your subscription has expired. Please renew.",
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

export default checkSubscription;