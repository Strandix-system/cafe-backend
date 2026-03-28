import { webhookService } from './service.js';
import { ApiError } from '../../utils/apiError.js';

export const webhookController = {
  razorpayWebhook: async (req, res, next) => {
    const signature = req.headers['x-razorpay-signature'];
    const rawBody = req.body.toString();

    const isValid = webhookService.verifySignature(rawBody, signature);

    if (!isValid) {
      return next(new ApiError(400, 'Invalid webhook signature'));
    }

    const eventData = JSON.parse(req.body.toString());
    await webhookService.handleEvent(eventData);

    return res.json({ status: 'ok' });
  },
};
