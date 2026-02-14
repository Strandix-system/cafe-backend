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

    const lastQr = await Qr.findOne({ adminId })
    .sort({ tableNumber: -1 })
    .select("tableNumber");

  const lastTable = lastQr ? lastQr.tableNumber : 0;

  // ✅ If already enough tables, do nothing
  if (lastTable >= totalTables) {
    return {
      message: "QRs already generated",
      total: lastTable,
    };
  }
  const qrList = [];
  // ✅ Create only missing tables
  for (let i = lastTable + 1; i <= totalTables; i++) {

    qrList.push({
      adminId,
      tableNumber: i,
      layoutId,
      qrCodeUrl: "",
    });
  }
  // ✅ Insert
  const createdQrs = await Qr.insertMany(qrList);
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
      layoutId: qr.layoutId,
    };
  },
  getAllQr: async (filter, options) => {
    const result = await Qr.paginate(filter, options);
    return result;
  },
  getQrCountforLayout: async (layoutId) => {
    const count = await Qr.countDocuments({ layoutId });
    return count;
  },
};

export default qrService;