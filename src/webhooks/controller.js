import webhookService from "./service.js";
import { ApiError } from "../../utils/apiError.js";

const webhookController = {

  razorpayWebhook: async (req, res, next) => {
    try {
      const signature = req.headers["x-razorpay-signature"];

      const isValid = webhookService.verifySignature(
        req.body,
        signature
      );

      if (!isValid) {
        return next(new ApiError(400, "Invalid webhook signature"));
      }

      const eventData = JSON.parse(req.body.toString());

      await webhookService.handleEvent(eventData);

      return res.json({ status: "ok" });

    } catch (error) {
      console.error("Webhook Error:", error);
      return next(new ApiError(500, "Internal Server Error"));
    }
  },
};

export default webhookController;