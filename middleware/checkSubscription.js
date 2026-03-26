import { Transaction } from "../model/transaction.js";
import { ApiError } from "../utils/apiError.js";
import User from "../model/user.js";

const checkSubscription = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return next();
    }

    const userId = req.user._id;
    const today = new Date();

    const latestTransaction = await Transaction.findOne({
      user: userId,
      subscriptionEndDate: { $ne: null },
    }).sort({ subscriptionEndDate: -1 });

    if (latestTransaction?.subscriptionEndDate) {
      const endDate = new Date(latestTransaction.subscriptionEndDate);

      const diffTime = endDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 0) {
        req.subscriptionAlert = {
          type: "expired",
          message:
            "Your subscription has expired. Please renew to continue using the service.",
          endDate,
          modalClosable: false,
        };

        await Transaction.findByIdAndUpdate(latestTransaction._id, {
          subscriptionStatus: "expired",
        });
        return next();
      }

      if (diffDays <= 7) {
        req.subscriptionAlert = {
          type: "expiringSoon",
          message: `Your subscription will expire in ${diffDays} day(s). Please renew soon.`,
          endDate,
          modalClosable: true,
        };
      }

      return next();
    }

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

    req.subscriptionAlert = {
      type: "trialExpired",
      message:
        "Your 14-day free trial has expired. Please subscribe to continue.",
      trialEnd,
      modalClosable: false,
    };
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

    const today = new Date();

    // If user has a subscription transaction, enforce subscription expiry
    if (latestSubscriptionTransaction) {
      const endDate = new Date(latestSubscriptionTransaction.subscriptionEndDate);

      if (
        today >= endDate ||
        latestSubscriptionTransaction.subscriptionStatus === "expired"
      ) {
        await Transaction.findByIdAndUpdate(latestSubscriptionTransaction._id, {
          subscriptionStatus: "expired",
        });

        return next(
          new ApiError(403, "Subscription expired. Please renew to continue.")
        );
      }

      return next();
    }

    // If no subscription exists, enforce 14-day trial expiry
    const user = await User.findById(req.user._id);

    const createdAt = new Date(user.createdAt);
    const trialEnd = new Date(createdAt);
    trialEnd.setDate(trialEnd.getDate() + 14);

    const diffTime = trialEnd - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      return next();
    }

    return next(
      new ApiError( 403,"Your 14-day free trial has expired. Please subscribe to continue."));
  } catch (error) {
    next(error);
  }
};

export { checkSubscription, blockExpiredSubscription };
