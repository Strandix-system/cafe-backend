import Transaction from "../model/transaction.js";
import { ApiError } from "../utils/apiError.js";

const checkSubscription = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return next();
    }

    const latestSubscriptionTransaction = await Transaction.findOne({
      user: req.user._id,
      subscriptionEndDate: { $ne: null },
    }).sort({ subscriptionEndDate: -1 });

    if (
      latestSubscriptionTransaction?.subscriptionEndDate &&
      new Date() > latestSubscriptionTransaction.subscriptionEndDate
    ) {
      req.subscriptionAlert = {
        type: "expired",
        message:
          "Your subscription has expired. Please renew to continue using the service.",
        endDate: latestSubscriptionTransaction.subscriptionEndDate,
      };

      await Transaction.findByIdAndUpdate(latestSubscriptionTransaction._id, {
        subscriptionStatus: "expired",
      });

      if (req.path === "/me") {
        return next();
      }

      return next(
        new ApiError(
          403,
          "Your subscription has expired. Please renew to continue using the service."
        )
      );
    }

    return next();
  } catch (error) {
    return next(error);
  }
};

export default checkSubscription;