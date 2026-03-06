import crypto from "crypto";
import Transaction from "../../model/transaction.js";

const webhookService = {
  verifySignature: (rawBody, signature) => {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    return expectedSignature === signature;
  },

  handleEvent: async (eventData) => {
    const eventType = eventData.event;
    const subscription = eventData.payload?.subscription?.entity;

    // Keep user subscription state in sync for all subscription lifecycle events.
    if (eventType?.startsWith("subscription.") && subscription?.id) {
      const startDate = subscription.start_at
        ? new Date(subscription.start_at * 1000)
        : subscription.current_start
        ? new Date(subscription.current_start * 1000)
        : subscription.charge_at
        ? new Date(subscription.charge_at * 1000)
        : null;

      const endDate = subscription.current_end
        ? new Date(subscription.current_end * 1000)
        : subscription.end_at
        ? new Date(subscription.end_at * 1000)
        : null;

      const transactionUpdate = {
        subscriptionStatus: subscription.status || null,
        subscriptionPlanId: subscription.plan_id || null,
        razorpayCustomerId: subscription.customer_id || null,
        source: "webhook",
        raw: eventData.payload?.subscription?.entity || {},
      };

      if (startDate) transactionUpdate.subscriptionStartDate = startDate;
      if (endDate) transactionUpdate.subscriptionEndDate = endDate;

      await Transaction.findOneAndUpdate(
        { razorpaySubscriptionId: subscription.id },
        {
          $set: transactionUpdate,
        }
      );

    }

    if (eventType === "payment.failed") {
      const payment = eventData.payload?.payment?.entity;

      if (payment?.subscription_id) {
        await Transaction.findOneAndUpdate(
          { razorpaySubscriptionId: payment.subscription_id },
          {
            $set: {
              subscriptionStatus: "expired",
              errorCode: payment.error_code || null,
              errorDescription: payment.error_description || null,
              source: "webhook",
              raw: payment,
            },
          }
        );

      }
    }

    return true;
  },
};

export default webhookService;
