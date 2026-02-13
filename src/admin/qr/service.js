import Qr from "../../../model/qr.js";
import QRCode from "qrcode";

const qrService = {

  createQr: async (adminId, totalTables, layoutId) => {

    if (!totalTables || totalTables < 1) {
      throw new Error("Invalid totalTables");
    }

    if (!process.env.FRONTEND_URL) {
      throw new Error("FRONTEND_URL not set");
    }

    const qrList = [];

    for (let i = 1; i <= totalTables; i++) {
      qrList.push({
        adminId,
        tableNumber: i,
        layoutId,
        qrCodeUrl: "",
      });
    }
    // 2. Insert all at once
    const createdQrs = await Qr.insertMany(qrList);
    // 3. Generate QR images
    for (const qr of createdQrs) {
     const frontendUrl = `${process.env.FRONTEND_URL}/${qr.layoutId}/${qr._id}`;
     const qrImage = await QRCode.toDataURL(frontendUrl);
      qr.qrCodeUrl = qrImage;
      await qr.save();
    }
    return createdQrs;
  },
  scanQr: async (qrId) => {
    const qr = await Qr.findById(qrId).populate("layoutId");
    if (!qr) throw new Error("Invalid QR");
    return {
      qrId: qr._id,
      tableNumber: qr.tableNumber,
      adminId: qr.adminId,
      layoutId: qr.layoutId, // ✅ SEND THIS
    };
  },
  getQrDetails: async (qrId) => {
    const qr = await Qr.findById(qrId);
    if (!qr) {
      throw new Error("Invalid QR");
    }
    return {
      qrId: qr._id,
      adminId: qr.adminId,
      layoutId: qr.layoutId,
      tableNumber: qr.tableNumber,
    };
  },
  getAllQr: async (filter, options) => {
    const result = await Qr.paginate(filter, options);
    return result;
  },
};

export default qrService;
