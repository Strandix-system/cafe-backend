import QRCode from "qrcode";
import jwt from "jsonwebtoken";
import Qr from "../../../model/qr.js";

const qrService = {

  createQr: async (adminId, tableNumber, layoutId) => {
    if (!tableNumber) {
      throw new Error("Table number is required");
    }

    const exists = await Qr.findOne({ adminId, tableNumber });
    if (exists) {
      throw new Error("QR already exists for this table");
    }

    const token = jwt.sign(
      {
        adminId,
        tableNumber,
        layoutId,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1y" } 
    );

    const scanUrl = `${process.env.FRONTEND_URL}/form?token=${token}`;

    const qrCodeUrl = await QRCode.toDataURL(scanUrl);

    const qr = await Qr.create({
      adminId,
      tableNumber,
      qrCodeUrl,
      token,
    });

    return qr;
  },

  getMyQrs: async (adminId) => {
    return await Qr.find({ adminId }).sort({ tableNumber: 1 });
  },

  deleteQr: async (id, adminId) => {
    const qr = await Qr.findOneAndDelete({
      _id: id,
      adminId,
    });

    if (!qr) throw new Error("QR not found");

    return true;
  },
};

export default qrService;
