import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../../model/user.js";
import razorpay from "../../config/razorpay.js";
import { Transaction } from "../../model/transaction.js";
import { ApiError } from "../../utils/apiError.js";

const PLAN_ID = process.env.RAZORPAY_PLAN_ID;

const verifySubscriptionSignature = (
  razorpay_payment_id,
  razorpay_subscription_id,
  razorpay_signature
) => {
  const body = `${razorpay_payment_id}|${razorpay_subscription_id}`;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    throw new ApiError(400, "Subscription payment verification failed");
  }
};

export const signUpService = {

  registerUserWithTrial: async (data) => {
    const { firstName, lastName, email, phoneNumber, password } = data;

    const existingUser = await User.findOne({ email, phoneNumber });
    if (existingUser) {
      throw new ApiError(409, "Email and phone number already exist.");
    }

    const user = await User.create({
      firstName,
      lastName,
      email,
      phoneNumber,
      password,
    });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return { user, token };
  },

  createSubscription: async (userId, planId = PLAN_ID) => {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    try {
      if (!planId) {
        throw new ApiError(400, "Razorpay plan ID is missing");
      }

      let customer = null;

      if (user.razorpayCustomerId) {
        try {
          customer = await razorpay.customers.fetch(user.razorpayCustomerId);
        } catch (e) {
          customer = null;
          user.razorpayCustomerId = null;
        }
      }

      if (!customer) {
        customer = await razorpay.customers.create({
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          contact: user.phoneNumber,
          // If a customer with the same details exists, fetch it instead of throwing.
          fail_existing: 0,
        });
        user.razorpayCustomerId = customer.id;
      }

      const isReusableSubscriptionStatus = (status) =>
        ["created", "authenticated", "active"].includes(status);

      let subscription = null;

      if (user.razorpaySubscriptionId) {
        try {
          const existing = await razorpay.subscriptions.fetch(
            user.razorpaySubscriptionId
          );

          const matchesCustomer = existing?.customer_id === customer?.id;
          const matchesPlan = existing?.plan_id === planId;
          const reusable = isReusableSubscriptionStatus(existing?.status);

          if (matchesCustomer && matchesPlan && reusable) {
            subscription = existing;
          } else {
            user.razorpaySubscriptionId = null;
          }
        } catch (e) {
          user.razorpaySubscriptionId = null;
        }
      }

      if (!subscription) {
        subscription = await razorpay.subscriptions.create({
          plan_id: planId,
          customer_notify: 1,
          total_count: 12,
          customer_id: customer.id,
          notes: {
            userId: String(user._id),
          },
        });

        user.razorpaySubscriptionId = subscription.id;
      }

      if (user.isModified()) {
        await user.save();
      }

      return { subscription, customer };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, "Failed to create subscription", error);
    }
  },

  verifySubscription: async (data, currentUser) => {
    const {
      razorpay_payment_id,
      razorpay_subscription_id,
      razorpay_signature,
    } = data;

    // Verify signature
    verifySubscriptionSignature(
      razorpay_payment_id,
      razorpay_subscription_id,
      razorpay_signature
    );

    // Fetch user
    const user = await User.findById(currentUser._id);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // Fetch payment + subscription
    const payment = await razorpay.payments.fetch(razorpay_payment_id);
    const normalizedStatus =
      payment.status === "authorized" || payment.status === "captured"
        ? "captured"
        : payment.status;

    // overwrite status in payment object
    payment.status = normalizedStatus;

    const subscription = await razorpay.subscriptions.fetch(
      razorpay_subscription_id
    );

    user.razorpayCustomerId = subscription?.customer_id || null;
    user.razorpaySubscriptionId = subscription?.id || razorpay_subscription_id;
    await user.save();


    // Calculate dates
    const startDate = payment?.created_at
      ? new Date(payment.created_at * 1000)
      : null;

    let endDate = null;

    if (subscription?.plan_id && startDate) {
      const plan = await razorpay.plans.fetch(subscription.plan_id);

      endDate = new Date(startDate);

      if (plan.period === "monthly") {
        endDate.setMonth(endDate.getMonth() + plan.interval);
      }
    }

    // DEFINE transactionData HERE
    const transactionData = {
      razorpayPaymentId: payment.id,
      razorpaySubscriptionId: razorpay_subscription_id,
      amount:
        typeof payment?.amount === "number" ? payment.amount / 100 : payment?.amount,
      method: payment?.method ,
      razorpayCustomerId: subscription?.customer_id ,
      razorpaySubscriptionPlanId: subscription?.plan_id || null,
      subscriptionStatus: subscription.status,
      subscriptionStartDate: startDate,
      subscriptionEndDate: endDate,
      paidAt: new Date(payment.created_at * 1000),
      raw: payment,
    };

    // USE IT HERE
    await Transaction.findOneAndUpdate(
      { razorpayPaymentId: payment.id },
      {
        $set: {
          user: user._id,
          ...transactionData,
          source: "signup",
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return user;
  },
  checkEmail: async (email, phoneNumber) => {

    const existingUser = await User.findOne({ email, phoneNumber });

    if (existingUser) {
      throw new ApiError(409, "Email and phone number already exist.");
    }
  },
  getTransactions: async (filter, options, userId) => {
    if (userId && !filter.user) {
      filter.user = userId;
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
        { razorpayCustomerId: { $regex: filter.search, $options: "i" } },
      ];
      delete filter.search;
    }
    options.populate = "user";
    const transactions = await Transaction.paginate(filter, options);
    return transactions;
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

    let razorpayCustomerId = user.razorpayCustomerId;
    const latestTransactionWithPlan = await Transaction.findOne({
      user: user._id,
      razorpaySubscriptionPlanId: { $ne: null },
    }).sort({ createdAt: -1 });

    let planId =
      latestTransactionWithPlan?.razorpaySubscriptionPlanId ||
      process.env.RAZORPAY_PLAN_ID;

    if (!razorpayCustomerId) {
      const latestTransactionWithCustomer = await Transaction.findOne({
        user: user._id,
        razorpayCustomerId: { $ne: null },
      }).sort({ createdAt: -1 });

      razorpayCustomerId = latestTransactionWithCustomer?.razorpayCustomerId;
    }

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

    const reusableStatuses = ["created", "authenticated", "active"];
    const existingSubs = await razorpay.subscriptions.all({
      customer_id: razorpayCustomerId,
      count: 20,
    });

    const reusableSub = existingSubs?.items?.find(
      (s) => s?.plan_id === planId && reusableStatuses.includes(s?.status)
    );

    if (reusableSub) {
      return reusableSub;
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
    verifySubscriptionSignature(
      razorpay_payment_id,
      razorpay_subscription_id,
      razorpay_signature
    );

    // 2 Fetch Payment
    const payment = await razorpay.payments.fetch(razorpay_payment_id);

    if (!payment) {
      throw new ApiError(404, "Payment not found");
    }

    // 3 Fetch Subscription
    const subscription = await razorpay.subscriptions.fetch(
      razorpay_subscription_id
    );

    if (!subscription) {
      throw new ApiError(404, "Subscription not found");
    }

    const startDate = payment?.created_at
      ? new Date(payment.created_at * 1000)
      : null;

    let endDate = null;

    if (subscription?.plan_id && startDate) {
      const plan = await razorpay.plans.fetch(subscription.plan_id);

      endDate = new Date(startDate);

      if (plan.period === "monthly") {
        endDate.setMonth(endDate.getMonth() + plan.interval);
      }
    }

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

    user.razorpayCustomerId = subscription?.customer_id || null;
    user.razorpaySubscriptionId = subscription?.id || razorpay_subscription_id;
    await user.save();

    // 6️ Log Transaction 
    await Transaction.findOneAndUpdate(
      { razorpayPaymentId: payment.id },
      {
        $set: {
          user: user._id,
          razorpayPaymentId: payment.id,
          razorpaySubscriptionId: razorpay_subscription_id,
          amount:
            typeof payment?.amount === "number" ? payment.amount / 100 : payment?.amount,
          method: payment.method,
          razorpayCustomerId: subscription?.customer_id,
          razorpaySubscriptionPlanId: subscription?.plan_id || null,
          subscriptionStatus: subscription.status,
          subscriptionStartDate: startDate,
          subscriptionEndDate: endDate,
          description: "Subscription renewal payment",
          paidAt: new Date(payment.created_at * 1000),
          source: "renewal",
          raw: payment,
        },
      },
      { upsert: true, new: true }
    );
    return user;
  },
};
