import {Transaction} from "../model/transaction.js";
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

    if (!latestSubscriptionTransaction?.subscriptionEndDate) {
      return next();
    }

    const today = new Date();
    const endDate = new Date(latestSubscriptionTransaction.subscriptionEndDate);

    const diffTime = endDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // 1️⃣ Subscription expired
    if (diffDays <= 0) {
      req.subscriptionAlert = {
        type: "expired",
        message:
          "Your subscription has expired. Please renew to continue using the service.",
        endDate,
        modalClosable: false, // FE can lock modal
      };

      await Transaction.findByIdAndUpdate(latestSubscriptionTransaction._id, {
        subscriptionStatus: "expired",
      });
    }

    // 2️⃣ Subscription expiring in next 7 days
    else if (diffDays <= 7) {
      req.subscriptionAlert = {
        type: "expiringSoon",
        message: `Your subscription will expire in ${diffDays} day(s). Please renew soon.`,
        endDate,
        modalClosable: true, // FE can close modal
      };
    }

    return next();
  } catch (error) {
    return next(error);
  }
};
 const blockExpiredSubscription = async (req, res, next) => {
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
export { checkSubscription, blockExpiredSubscription };