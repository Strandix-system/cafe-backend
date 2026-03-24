import { Transaction } from "../model/transaction.js";
import { ApiError } from "../utils/apiError.js";
import { createSubscriptionNotifications } from "../subscription.expire.cron.js";

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

    if (diffDays <= 7) {
      try {
        await createSubscriptionNotifications(
          req.user,
          latestSubscriptionTransaction
        );
      } catch (error) {
        console.error(
          "Subscription notification creation failed:",
          error.message
        );
      }
    }

    if (diffDays <= 0) {
      req.subscriptionAlert = {
        type: "expired",
        message:
          "Your subscription has expired. Please renew to continue using the service.",
        endDate,
        modalClosable: false,
      };

      await Transaction.findByIdAndUpdate(latestSubscriptionTransaction._id, {
        subscriptionStatus: "expired",
      });
    } else if (diffDays <= 7) {
      req.subscriptionAlert = {
        type: "expiringSoon",
        message: `Your subscription will expire in ${diffDays} day(s). Please renew soon.`,
        endDate,
        modalClosable: true,
      };
    }

    return next();
  } catch (error) {
    return next(error);
  }
};

const blockExpiredSubscription = async (req, res, next) => {
  try {
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

    if (
      today >= endDate ||
      latestSubscriptionTransaction.subscriptionStatus === "expired"
    ) {
      return next(
        new ApiError(403, "Subscription expired. Please renew to continue.")
      );
    }
  } catch (error) {
    next(error);
  }
};

export { checkSubscription, blockExpiredSubscription };
