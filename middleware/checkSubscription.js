import { Transaction } from '../model/transaction.js';
import User from '../model/user.js';
import { resolveAdminOwnerId } from '../utils/adminAccess.js';
import { ApiError } from '../utils/apiError.js';

const checkSubscription = async (req, res, next) => {
  try {
    if (!['admin', 'manager'].includes(req.user.role)) {
      return next();
    }

    const userId = resolveAdminOwnerId(req.user);
    const today = new Date();
    const ONE_DAY_IN_MS = 1000 * 60 * 60 * 24;

    const setAlerts = (alert) => {
      req.subscriptionAlert = alert;
      req.notificationAlert = alert;
    };

    const latestTransaction = await Transaction.findOne({
      user: userId,
      subscriptionEndDate: { $ne: null },
    }).sort({ subscriptionEndDate: -1 });

    if (latestTransaction?.subscriptionEndDate) {
      const endDate = new Date(latestTransaction.subscriptionEndDate);

      const diffTime = endDate - today;
      const diffDays = Math.ceil(diffTime / ONE_DAY_IN_MS);

      if (diffDays <= 0) {
        setAlerts({
          type: 'expired',
          message:
            'Your subscription has expired. Please renew to continue using the service.',
          endDate,
          modalClosable: false,
        });

        if (latestTransaction.subscriptionStatus !== 'expired') {
          await Transaction.findByIdAndUpdate(latestTransaction._id, {
            subscriptionStatus: 'expired',
          });
        }
        return next();
      }

      if (diffDays <= 7) {
        setAlerts({
          type: 'expiringSoon',
          message: `Your subscription will expire in ${diffDays} day(s). Please renew soon.`,
          endDate,
          modalClosable: true,
        });
      }

      return next();
    }

    const user = await User.findById(userId).select('createdAt');
    if (!user) {
      return next(new ApiError(404, 'User not found'));
    }

    const createdAt = new Date(user.createdAt);
    const trialEnd = new Date(createdAt);
    trialEnd.setDate(trialEnd.getDate() + 14);

    const trialDiffTime = trialEnd - today;
    const trialDiffDays = Math.ceil(trialDiffTime / ONE_DAY_IN_MS);

    if (trialDiffDays > 0) {
      setAlerts({
        type: 'trial',
        message: `Free trial active. Ends in ${trialDiffDays} day(s).`,
        trialEnd,
        modalClosable: true,
      });
      return next();
    }

    setAlerts({
      type: 'trialExpired',
      message:
        'Your 14-day free trial has expired. Please subscribe to continue.',
      trialEnd,
      modalClosable: false,
    });
    return next();
  } catch (error) {
    return next(error);
  }
};

const blockExpiredSubscription = async (req, res, next) => {
  try {
    if (!['admin', 'manager'].includes(req.user.role)) {
      return next();
    }

    const latestTransaction = await Transaction.findOne({
      user: resolveAdminOwnerId(req.user),
      subscriptionEndDate: { $ne: null },
    }).sort({ subscriptionEndDate: -1 });

    const today = new Date();

    // If user has a subscription transaction, enforce subscription expiry
    if (latestTransaction) {
      const endDate = new Date(latestTransaction.subscriptionEndDate);

      if (
        today >= endDate ||
        latestTransaction.subscriptionStatus === 'expired'
      ) {
        await Transaction.findByIdAndUpdate(latestTransaction._id, {
          subscriptionStatus: 'expired',
        });

        return next(
          new ApiError(403, 'Subscription expired. Please renew to continue.'),
        );
      }

      return next();
    }

    // If no subscription exists, enforce 14-day trial expiry
    const user = await User.findById(resolveAdminOwnerId(req.user));

    const createdAt = new Date(user.createdAt);
    const trialEnd = new Date(createdAt);
    trialEnd.setDate(trialEnd.getDate() + 14);

    const diffTime = trialEnd - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      return next();
    }

    return next(
      new ApiError(
        403,
        'Your 14-day free trial has expired. Please subscribe to continue.',
      ),
    );
  } catch (error) {
    next(error);
  }
};

export { checkSubscription, blockExpiredSubscription };
