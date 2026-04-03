import crypto from 'crypto';

import { Transaction } from '../../model/transaction.js';
import User from '../../model/user.js';

export const webhookService = {
  verifySignature: (rawBody, signature) => {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    return expectedSignature === signature;
  },

  handleEvent: async (eventData) => {
    const eventType = eventData.event;
    const subscription = eventData.payload?.subscription?.entity;

    // Keep user subscription state in sync for all subscription lifecycle events.
    if (eventType?.startsWith('subscription.') && subscription?.id) {
      const userMatch = [{ razorpaySubscriptionId: subscription.id }];
      if (subscription.customer_id) {
        userMatch.push({ razorpayCustomerId: subscription.customer_id });
      }

      const user = await User.findOne({ $or: userMatch });

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
        razorpayCustomerId: subscription.customer_id || null,
        razorpaySubscriptionPlanId: subscription.plan_id || null,
        source: 'webhook',
        raw: eventData.payload?.subscription?.entity || {},
      };

      if (startDate) transactionUpdate.subscriptionStartDate = startDate;
      if (endDate) transactionUpdate.subscriptionEndDate = endDate;

      if (user) {
        await User.findByIdAndUpdate(user._id, {
          $set: {
            razorpayCustomerId: subscription.customer_id || null,
            razorpaySubscriptionId: subscription.id,
          },
        });

        await Transaction.findOneAndUpdate(
          { razorpaySubscriptionId: subscription.id },
          { $set: { user: user._id, ...transactionUpdate } },
          { new: true },
        );
      }
    }
    if (eventType === 'invoice.paid') {
      const invoice = eventData.payload?.invoice?.entity;

      if (!invoice?.subscription_id) return;

      const user = await User.findOne({
        razorpaySubscriptionId: invoice.subscription_id,
      });

      const startDate = invoice.billing_start
        ? new Date(invoice.billing_start * 1000)
        : null;

      const endDate = invoice.billing_end
        ? new Date(invoice.billing_end * 1000)
        : null;

      if (user) {
        const invoiceAmount =
          typeof invoice?.amount_paid === 'number'
            ? invoice.amount_paid
            : typeof invoice?.amount === 'number'
              ? invoice.amount
              : null;

        await Transaction.findOneAndUpdate(
          { razorpaySubscriptionId: invoice.subscription_id },
          {
            $set: {
              user: user._id,
              razorpayPaymentId: invoice.payment_id || null,
              razorpaySubscriptionId: invoice.subscription_id,
              razorpayCustomerId:
                invoice.customer_id || user.razorpayCustomerId || null,
              razorpaySubscriptionPlanId: invoice.plan_id || null,
              amount:
                typeof invoiceAmount === 'number' ? invoiceAmount / 100 : 0,
              subscriptionStartDate: startDate,
              subscriptionEndDate: endDate,
              subscriptionStatus: 'active',
              paidAt: invoice.paid_at
                ? new Date(invoice.paid_at * 1000)
                : new Date(),
              source: 'webhook',
              raw: invoice,
            },
          },
          { upsert: true, new: true, setDefaultsOnInsert: true },
        );
      }
    }

    if (eventType === 'payment.failed') {
      const payment = eventData.payload?.payment?.entity;

      if (payment?.subscription_id) {
        const user = await User.findOne({
          razorpaySubscriptionId: payment.subscription_id,
        });

        if (user) {
          await Transaction.findOneAndUpdate(
            { razorpaySubscriptionId: payment.subscription_id },
            {
              $set: {
                user: user._id,
                subscriptionStatus: 'expired',
                errorCode: payment.error_code || null,
                errorDescription: payment.error_description || null,
                source: 'webhook',
                raw: payment,
              },
            },
            { new: true },
          );
        }
      }
    }

    return true;
  },
};
