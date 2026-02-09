import QRCode from "qrcode";
import jwt from "jsonwebtoken";
import Qr from "../../../model/qr.js";
import { verifyQrToken } from "../../../utils/qrToken.js";


const qrService = {
  createBulkQr: async (adminId, totalTables, layoutId) => {

    const createdQrs = [];

    const lastQr = await Qr.findOne({ adminId })
      .sort({ tableNumber: -1 });

    let start = lastQr ? lastQr.tableNumber + 1 : 1;

    for (let i = 0; i < totalTables; i++) {

      const tableNumber = start + i;

      const exists = await Qr.findOne({ adminId, tableNumber });
      if (exists) continue;
      
      const token = jwt.sign(
        { adminId, tableNumber, layoutId },
        process.env.JWT_SECRET,
        { expiresIn: "1y" }
      );

      const encodedToken = encodeURIComponent(token);

      const scanUrl =
        `${process.env.FRONTEND_URL}/form?token=${encodedToken}`;

      const qrCodeUrl = await QRCode.toDataURL(scanUrl);

      const qr = await Qr.create({
        adminId,
        tableNumber,
        qrCodeUrl,
        token,
      });

      createdQrs.push(qr);
    }

    return createdQrs;
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
  verifyScan: async (token) => {

    const decoded = verifyQrToken(token);

    const qr = await Qr.findOne({ token });
    if (!qr) {
      throw new ApiError(400, "Invalid QR code");
    }
    return {
      tableNumber: decoded.tableNumber,
      adminId: decoded.adminId,
      layoutId: decoded.layoutId,
      valid: true,
    };
  },
  getAllQr: async (adminId, filter, options) => {

  filter.adminId = adminId;
  options.sortBy = "tableNumber:asc"; 

  const result = await Qr.paginate(filter, options);

  return result;
},
};

export default qrService;
