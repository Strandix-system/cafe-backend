import webhookService from "./service.js";

const webhookController = {

  razorpayWebhook: async (req, res) => {
    try {
      const signature = req.headers["x-razorpay-signature"];

      const isValid = webhookService.verifySignature(
        req.body,
        signature
      );

      if (!isValid) {
        return res.status(400).json({
          success: false,
          message: "Invalid webhook signature",
        });
      }

      const eventData = JSON.parse(req.body.toString());

      await webhookService.handleEvent(eventData);

      return res.json({ status: "ok" });

    } catch (error) {
      console.error("Webhook Error:", error);
      return res.status(500).json({
        success: false,
        message: "Webhook processing failed",
      });
    }
  },
};

export default webhookController;