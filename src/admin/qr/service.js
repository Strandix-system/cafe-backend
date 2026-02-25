import Qr from "../../../model/qr.js";
import layout from "../../../model/layout.js"
import QRCode from "qrcode";

const qrService = {
  createQr: async (adminId, totalTables) => {

    const layoutExists = await layout.exists({ adminId });
    if (!layoutExists) {
      throw new Error("Please create cafe layout before generating Qr")
    }
    if (!totalTables || totalTables < 1) {
      throw new Error("Invalid totalTables");
    }

    if (!process.env.PORTFOLIO_URL) {
      throw new Error("PORTFOLIO_URL not set");
    }

    const lastQr = await Qr.findOne({ adminId })
      .sort({ tableNumber: -1 })
      .select("tableNumber");

    const lastTable = lastQr ? lastQr.tableNumber : 0;

    if (lastTable >= totalTables) {
      return {
        message: "QRs already generated",
        total: lastTable,
      };
    }
    const qrList = [];
    for (let i = lastTable + 1; i <= totalTables; i++) {

      qrList.push({
        adminId,
        tableNumber: i,
        qrCodeUrl: "",
      });
    }
    const createdQrs = await Qr.insertMany(qrList);
    for (const qr of createdQrs) {
      const portfolioUrl = `${process.env.PORTFOLIO_URL}/${qr._id}`;
      const qrImage = await QRCode.toDataURL(portfolioUrl);
      qr.qrCodeUrl = qrImage;
      await qr.save();
    }
    return createdQrs;
  },
  scanQr: async (qrId) => {
    const qr = await Qr.findById(qrId).populate("adminId");

    if (!qr) {
      throw new Error("Invalid QR");
    }

    if (!qr.adminId || !qr.adminId.isActive) {
      throw new Error("This QR is disabled because the account is inactive");
    }

    return qr;
  },
  getAllQr: async (filter, options, adminId) => {
    filter.adminId = adminId;
    if (filter.search) {
      filter.tableNumber = Number(filter.search);
      delete filter.search;
    }
    const result = await Qr.paginate(filter, options);
    return result;
  },
  getQrCountforLayout: async (adminId) => {
    const count = await Qr.countDocuments({ adminId });
    return count;
  },
};

export default qrService;
