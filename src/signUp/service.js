import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../../model/user.js";
import razorpay from "../../config/razorpay.js";
import Transaction from "../../model/transaction.js";
import { ApiError } from "../../utils/apiError.js";

const PLAN_ID = process.env.RAZORPAY_PLAN_ID;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const toDate = (unixTime) => {
  if (!unixTime) return null;
  return new Date(unixTime * 1000);
};

const addPeriodToDate = (baseDate, period, interval = 1) => {
  if (!baseDate || !period) return null;
  const date = new Date(baseDate);
  const step = Number(interval) || 1;

  switch (period) {
    case "daily":
      date.setDate(date.getDate() + step);
      return date;
    case "weekly":
      date.setDate(date.getDate() + step * 7);
      return date;
    case "monthly":
      date.setMonth(date.getMonth() + step);
      return date;
    case "yearly":
      date.setFullYear(date.getFullYear() + step);
      return date;
    default:
      return null;
  }
};

const resolveSubscriptionDates = async (subscription, payment = null) => {
  const startDate =
    toDate(subscription?.start_at) ||
    toDate(subscription?.current_start) ||
    toDate(subscription?.charge_at) ||
    toDate(payment?.captured_at) ||
    toDate(payment?.created_at);

  let endDate =
    toDate(subscription?.current_end) ||
    toDate(subscription?.end_at);

  if (!endDate && startDate && subscription?.plan_id) {
    try {
      const plan = await razorpay.plans.fetch(subscription.plan_id);
      endDate = addPeriodToDate(startDate, plan?.period, plan?.interval);
    } catch (_) {
      endDate = null;
    }
  }

  return { startDate, endDate };
};

const signUpService = {

  createSubscription: async (data) => {
    const { firstName, lastName, email, phoneNumber, planId } = data;
    const selectedPlanId = planId || PLAN_ID;

    if (!selectedPlanId) {
      throw new ApiError(400, "Razorpay plan ID is missing");
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ApiError(400, "Email already exists");
    }

    const customer = await razorpay.customers.create({
      name: `${firstName} ${lastName}`,
      email,
      contact: phoneNumber,
    });

    const subscription = await razorpay.subscriptions.create({
      plan_id: selectedPlanId,
      customer_notify: 1,
      total_count: 12,
      customer_id: customer.id,
    });

    return {
      subscription,
      customer,
    };
  },

  verifySubscriptionAndCreateUser: async (data) => {
    const {
      razorpay_payment_id,
      razorpay_subscription_id,
      razorpay_signature,
      firstName,
      lastName,
      email,
      phoneNumber,
      password,
    } = data;

    const body = `${razorpay_subscription_id}|${razorpay_payment_id}`;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      throw new ApiError(400, "Subscription payment verification failed");
    }

    const existingUser = await User.findOne({
      email: email.toLowerCase(),
    });
    if (existingUser) {
      throw new ApiError(409, "User already exists");
    }
    const payment = await razorpay.payments.fetch(razorpay_payment_id);
    if (payment.status !== "captured") {
      throw new ApiError(400, "Payment not captured");
    }

    const subscription = await razorpay.subscriptions.fetch(
      razorpay_subscription_id
    );

    const { startDate, endDate } = await resolveSubscriptionDates(
      subscription,
      payment
    );

    const user = await User.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      phoneNumber,
      password,
      role: "admin",
    });

    await Transaction.findOneAndUpdate(
      { razorpayPaymentId: payment.id },
      {
        $set: {
          user: user._id,
          razorpayPaymentId: payment.id,
          razorpaySubscriptionId: razorpay_subscription_id,
          amount: payment.amount,  
          method: payment.method ,
          description: payment.description || "Signup subscription payment",
          paidAt: toDate(payment.created_at),
          razorpayCustomerId: subscription.customer_id || null,
          subscriptionPlanId: subscription.plan_id || null,
          subscriptionStatus: payment.status || null,
          subscriptionStartDate: startDate,
          subscriptionEndDate: endDate,
          source: "signup",
          raw: payment,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return { user, token };
  },
  checkEmailExists: async (email, phoneNumber) => {
    if (!email && !phoneNumber) {
      throw new ApiError(400, "At least email or phone number is required");
    }
    const query = {
      $or: []
    };
    if (email) {
      query.$or.push({ email: email.toLowerCase() });
    }
    if (phoneNumber) {
      query.$or.push({ phoneNumber });
    }
    const existingUser = await User.findOne(query);
    if (existingUser) {

      if (email && existingUser.email === email.toLowerCase()) {
        throw new ApiError(409, "Email already exists.");
      }
      if (phoneNumber && existingUser.phoneNumber === phoneNumber) {
        throw new ApiError(409, "Phone number already exists.");
      }
    }
    return {
      message: "Email and phone number are available.",
    };
  },

  getTransactions: async (filter, options, user) => {
    let targetUserId = null;

    if (user.role === "admin") {
      filter.user = user._id;
      targetUserId = user._id;
    }

    if (user.role === "superadmin") {

      if (filter.adminId) {
        filter.user = filter.adminId;
        targetUserId = filter.adminId;
      }

      delete filter.adminId;
    }

    if (filter.fromDate || filter.toDate) {
      filter.createdAt = {};

      if (filter.fromDate) {
        filter.createdAt.$gte = new Date(filter.fromDate);
      }

      if (filter.toDate) {
        const toDate = new Date(filter.toDate);
        toDate.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = toDate;
      }

      delete filter.fromDate;
      delete filter.toDate;
    }

    if (filter.search) {
      filter.$or = [
        { razorpayPaymentId: { $regex: filter.search, $options: "i" } },
        { razorpaySubscriptionId: { $regex: filter.search, $options: "i" } },
        { razorpayCustomerId: { $regex: filter.search, $options: "i" } },
      ];
      delete filter.search;
    }

    options.populate = "user";

    const transactions = await Transaction.paginate(filter, options);

    let subscriptionAlert = null;

    if (targetUserId) {
      const latestSubscriptionTransaction = await Transaction.findOne({
        user: targetUserId,
        subscriptionEndDate: { $ne: null },
      }).sort({ subscriptionEndDate: -1 });

      if (latestSubscriptionTransaction?.subscriptionEndDate) {
        const today = new Date();
        const endDate = latestSubscriptionTransaction.subscriptionEndDate;
        const daysRemaining = Math.ceil(
          (endDate.getTime() - today.getTime()) / ONE_DAY_MS
        );

        if (daysRemaining < 0) {
          subscriptionAlert = {
            type: "expired",
            message: "Your subscription has expired. Please renew.",
            endDate,
            daysRemaining,
          };
        } else if (daysRemaining <= 7) {
          subscriptionAlert = {
            type: "expiring_soon",
            message: `Your subscription will expire in ${daysRemaining} day(s). Please renew soon.`,
            endDate,
            daysRemaining,
          };
        }
      }
    }

    return {
      ...transactions,
      subscriptionAlert,
    };
  },
  getAllPlansService: async () => {
    const razorpayPlanIds = [
      process.env.RAZORPAY_PLAN_ID,
    ];

    const plans = await Promise.all(
      razorpayPlanIds.map((id) => razorpay.plans.fetch(id))
    );

    return plans;
  },
  renewSubscription: async (userId) => {
    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError(404, "User not found");
    }
    const latestTransactionWithCustomer = await Transaction.findOne({
      user: user._id,
      razorpayCustomerId: { $ne: null },
    }).sort({ createdAt: -1 });

    const razorpayCustomerId = latestTransactionWithCustomer?.razorpayCustomerId;
    const planId =
      latestTransactionWithCustomer?.subscriptionPlanId || process.env.RAZORPAY_PLAN_ID;

    if (!razorpayCustomerId) {
      throw new ApiError(400, "Razorpay customer not linked for this user");
    }
    if (!planId) {
      throw new ApiError(400, "Razorpay plan ID is missing");
    }
    const existingUser = await User.findOne({ email: user.email.toLowerCase() });
    if (!existingUser) {
      throw new ApiError(400, "Email does not exist");
    }

    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      customer_notify: 1,
      total_count: 12,
      customer_id: razorpayCustomerId,
    });

    return subscription;
  },

  verifyRenewSubscription: async (data, currentUser = null) => {
    const {
      razorpay_payment_id,
      razorpay_subscription_id,
      razorpay_signature,
    } = data;

    //-1 Verify Signature (Correct Order)
    const body = `${razorpay_payment_id}|${razorpay_subscription_id}`;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      throw new ApiError(400, "Subscription payment verification failed");
    }

    // 2 Fetch Payment
    const payment = await razorpay.payments.fetch(razorpay_payment_id);

    if (!payment) {
      throw new ApiError(404, "Payment not found");
    }

    if (payment.status !== "captured") {
      throw new ApiError(400, "Payment not successful");
    }

    // 3 Fetch Subscription
    const subscription = await razorpay.subscriptions.fetch(
      razorpay_subscription_id
    );

    if (!subscription) {
      throw new ApiError(404, "Subscription not found");
    }

    const { startDate, endDate } = await resolveSubscriptionDates(
      subscription,
      payment
    );

    // 4️ Find Existing User
    const existingTransaction = await Transaction.findOne({
      razorpayCustomerId: subscription.customer_id,
    }).sort({ createdAt: -1 });

    const user = existingTransaction
      ? await User.findById(existingTransaction.user)
      : null;

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    if (
      currentUser &&
      currentUser.role !== "superadmin" &&
      String(user._id) !== String(currentUser._id)
    ) {
      throw new ApiError(403, "Unauthorized renewal verification");
    }

    // 5️ Update User Subscription

    // 6️ Log Transaction 
    await Transaction.findOneAndUpdate(
      { razorpayPaymentId: payment.id },
      {
        $set: {
          user: user._id,
          razorpayPaymentId: payment.id,
          razorpaySubscriptionId: razorpay_subscription_id,
          amount: payment.amount,
          method: payment.method || null,
          razorpayCustomerId: subscription.customer_id,
          subscriptionPlanId: subscription.plan_id,
          subscriptionStatus: payment.status,
          subscriptionStartDate: startDate,
          subscriptionEndDate: endDate,
          description: "Subscription renewal payment",
          paidAt: toDate(payment.created_at),
          source: "renewal",
          raw: payment,
        },
      },
      { upsert: true, new: true }
    );

    return user;
  },
};
export default signUpService;