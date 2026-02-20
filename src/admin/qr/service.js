import Qr from "../../../model/qr.js";
import QRCode from "qrcode";
import CafeLayout from "../../../model/adminLayout.js";


const qrService = {
  createQr: async (adminId, totalTables) => {

    const layoutExists = await CafeLayout.exists({ adminId });
    if (!layoutExists) {
      const err = new Error("Please create cafe layout before generating QR");
      err.statusCode = 400;
      throw err;
    }

    if (!totalTables || totalTables < 1) {
      const err = new Error("Invalid totalTables");
      err.statusCode = 400;
      throw err;
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
        qrCodeUrl: "",
      });
    }
    // ✅ Insert
    const createdQrs = await Qr.insertMany(qrList);
    for (const qr of createdQrs) {
      const frontendUrl = `${process.env.FRONTEND_URL}/${qr._id}`;
      const qrImage = await QRCode.toDataURL(frontendUrl);
      qr.qrCodeUrl = qrImage;
      await qr.save();
    }
    return createdQrs;
  },
  scanQr: async (qrId) => {
    const qr = await Qr.findById(qrId);
    if (!qr) throw new Error("Invalid QR");
    return qr;
  },
  getAllQr: async (filter, options) => {
    const result = await Qr.paginate(filter, options);
    return result;
  },
  getQrCountforLayout: async (adminId) => {
    const count = await Qr.countDocuments({ adminId });
    return count;
  },
};

export default qrService;