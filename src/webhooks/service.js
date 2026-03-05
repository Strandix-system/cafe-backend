import crypto from "crypto";
import User from "../../model/user.js";

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
      await User.findOneAndUpdate(
        { subscriptionId: subscription.id },
        {
          subscriptionStatus: subscription.status,
          subscriptionStartDate: subscription.start_at
            ? new Date(subscription.start_at * 1000)
            : null,
          subscriptionEndDate: subscription.current_end
            ? new Date(subscription.current_end * 1000)
            : null,
        }
      );
    }

    if (eventType === "payment.failed") {
      const payment = eventData.payload?.payment?.entity;

      if (payment?.subscription_id) {
        await User.findOneAndUpdate(
          { subscriptionId: payment.subscription_id },
          { subscriptionStatus: "expired" }
        );
      }
    }

    return true;
  },
};

export default webhookService;
