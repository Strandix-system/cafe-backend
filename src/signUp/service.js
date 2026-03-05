import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../../model/user.js";
import razorpay from "../../config/razorpay.js";
import Transaction from "../../model/transaction.js";

const PLAN_ID = process.env.RAZORPAY_PLAN_ID;

const toDate = (unixTime) => {
  if (!unixTime) return null;
  return new Date(unixTime * 1000);
};

const signUpService = {

  createSubscription: async (data) => {
    const { firstName, lastName, email, phoneNumber } = data;

    const customer = await razorpay.customers.create({
      name: `${firstName} ${lastName}`,
      email,
      contact: phoneNumber,
    });

    const subscription = await razorpay.subscriptions.create({
      plan_id: PLAN_ID,
      customer_notify: 1,
      total_count: 12, // monthly for 12 months
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

    const body = `${razorpay_payment_id}|${razorpay_subscription_id}`;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      throw new Error("Subscription payment verification failed");
    }

    const existingUser = await User.findOne({
      email: email.toLowerCase(),
    });
    if (existingUser) {
      throw new Error("User already exists");
    }
    const payment = await razorpay.payments.fetch(razorpay_payment_id);
    if (payment.status !== "captured") {
      throw new Error("Payment not captured");
    }
  
    const subscription = await razorpay.subscriptions.fetch(
      razorpay_subscription_id
    );

    const startDate = subscription.start_at
      ? new Date(subscription.start_at * 1000)
      : null;

    const endDate = subscription.current_end
      ? new Date(subscription.current_end * 1000)
      : null;

    const user = await User.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      phoneNumber,
      password,
      role: "admin",
      subscriptionId: razorpay_subscription_id,
      subscriptionPlanId: subscription.plan_id,
      subscriptionStatus: subscription.status,
      subscriptionStartDate: startDate,
      subscriptionEndDate: endDate,
      razorpayCustomerId: subscription.customer_id,
    });

    await Transaction.findOneAndUpdate(
      { razorpayPaymentId: payment.id },
      {
        $set: {
          user: user._id,
          subscription: null,
          razorpayPaymentId: payment.id,
          razorpaySubscriptionId: razorpay_subscription_id,
          amount: payment.amount || 0,
          currency: payment.currency || "INR",
          status: payment.status || "captured",
          method: payment.method || null,
          email: payment.email || email,
          contact: String(payment.contact || phoneNumber || ""),
          description: payment.description || "Signup subscription payment",
          invoiceId: payment.invoice_id || null,
          errorCode: payment.error_code || null,
          errorDescription: payment.error_description || null,
          paidAt: toDate(payment.created_at),
          capturedAt: toDate(payment.captured_at),
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
      const error = new Error("Email or phone number is required.");
      error.statusCode = 400;
      throw error;
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
        const error = new Error("Email already registered.");
        error.statusCode = 409;
        throw error;
      }
      if (phoneNumber && existingUser.phoneNumber === phoneNumber) {
        const error = new Error("Phone number already exists.");
        error.statusCode = 409;
        throw error;
      }
    }
    return {
      message: "Email and phone number are available.",
    };
  },

  getTransactions: async (filter, options, user) => {

    if (user.role === "admin") {
      filter.user = user._id;
    }

    if (user.role === "superadmin") {

      if (filter.adminId) {
        filter.user = filter.adminId; 
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
        { email: { $regex: filter.search, $options: "i" } },
        { razorpayPaymentId: { $regex: filter.search, $options: "i" } },
        { razorpaySubscriptionId: { $regex: filter.search, $options: "i" } },
      ];
      delete filter.search;
    }

    options.populate = "user";

    return await Transaction.paginate(filter, options);
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
      throw new Error("User not found");
    }
    if (!user.razorpayCustomerId) {
      throw new Error("Razorpay customer not linked for this user");
    }

    const subscription = await razorpay.subscriptions.create({
      plan_id: process.env.RAZORPAY_PLAN_ID,
      customer_notify: 1,
      total_count: 12,
      customer_id: user.razorpayCustomerId,
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
    throw new Error("Subscription payment verification failed");
  }

  // 2 Fetch Payment
  const payment = await razorpay.payments.fetch(razorpay_payment_id);

  if (!payment) {
    throw new Error("Payment not found");
  }

  if (payment.status !== "captured") {
    throw new Error("Payment not successful");
  }

  // 3 Fetch Subscription
  const subscription = await razorpay.subscriptions.fetch(
    razorpay_subscription_id
  );

  if (!subscription) {
    throw new Error("Subscription not found");
  }

  // Only allow active subscription
  if (subscription.status !== "active") {
    throw new Error("Subscription not active");
  }

  const startDate = subscription.start_at
    ? new Date(subscription.start_at * 1000)
    : null;

  const endDate = subscription.current_end
    ? new Date(subscription.current_end * 1000)
    : null;

  // 4️ Find Existing User
  const user = await User.findOne({
    razorpayCustomerId: subscription.customer_id,
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (
    currentUser &&
    currentUser.role !== "superadmin" &&
    String(user._id) !== String(currentUser._id)
  ) {
    throw new Error("Unauthorized renewal verification");
  }

  // 5️ Update User Subscription
  user.subscriptionId = razorpay_subscription_id;
  user.subscriptionStatus = subscription.status;
  user.subscriptionStartDate = startDate;
  user.subscriptionEndDate = endDate;

  await user.save();

  // 6️ Log Transaction 
  await Transaction.findOneAndUpdate(
    { razorpayPaymentId: payment.id },
    {
      $set: {
        user: user._id,
        razorpayPaymentId: payment.id,
        razorpaySubscriptionId: razorpay_subscription_id,
        amount: payment.amount || 0,
        currency: payment.currency || "INR",
        status: payment.status,
        method: payment.method || null,
        email: payment.email,
        contact: payment.contact,
        description: "Subscription renewal payment",
        paidAt: toDate(payment.created_at),
        capturedAt: toDate(payment.captured_at),
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
