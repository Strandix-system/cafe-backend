import { Transaction } from "../model/transaction.js";
import { ApiError } from "../utils/apiError.js";

export const blockExpiredSubscription = async (req, res, next) => {
  try {
    // apply only for admin
    if (req.user.role !== "admin") {
      return next();
    }

    const latestSubscriptionTransaction = await Transaction.findOne({
      user: req.user._id,
      subscriptionEndDate: { $ne: null },
    }).sort({ subscriptionEndDate: -1 });

    if (!latestSubscriptionTransaction) {
      return next();
    }

    const today = new Date();
    const endDate = new Date(latestSubscriptionTransaction.subscriptionEndDate);

    // check expired
    if (
      today >= endDate ||
      latestSubscriptionTransaction.subscriptionStatus === "expired"
    ) {
      return new ApiError(403, "Subscription expired. Please renew to continue.");
    }

    next();
  } catch (error) {
    next(error);
  }
};