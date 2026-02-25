import axios from "axios";

const sendWhatsAppMessage = async ({ to, message }) => {
  try {
    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: {
          body: message,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("WhatsApp Error:", error.response?.data || error.message);
    throw new Error("Failed to send WhatsApp message");
  }
};

export default sendWhatsAppMessage;