import qrService from "./service.js";
import { pick } from "../../../utils/pick.js";
import { sendSuccessResponse } from "../../../utils/response.js";

const qrController = {
  // Admin creates QR
  createQr: async (req, res, next) => {
    try {

      const { totalTables, layoutId } = req.body;

      const result = await qrService.createQr(
        req.user._id,
        totalTables,
        layoutId
      );

      sendSuccessResponse(res, 201, "QR codes created", result);
    } catch (err) {
      next(err);
    }
  },
  // Customer scans QR
  scanQr: async (req, res, next) => {
    try {
      const { qrId } = req.params;

      const result = await qrService.scanQr(qrId);

      sendSuccessResponse(res, 200, "QR scanned", result);
    } catch (err) {
      next(err);
    }
  },
  //     getQrDetails: async (qrId) => {
  //   const qr = await Qr.findById(qrId)
  //     .populate("layoutId");

  //   if (!qr) {
  //     throw new Error("Invalid QR");
  //   }

  //   return {
  //     qrId: qr._id,
  //     adminId: qr.adminId,
  //     layoutId: qr.layoutId._id,
  //     tableNumber: qr.tableNumber,
  //   };
  // },
  getAllQr: async (req, res, next) => {
    try {
      const filter = {
        adminId: req.user._id,
      };

      const options = {
        ...pick(req.query, ["page", "limit", "populate"]),
        sortBy: "tableNumber:asc",
      };

      const result = await qrService.getAllQr(filter, options);

      sendSuccessResponse(res, 200, "QR codes fetched", result);
    } catch (error) {
      next(error);
    }
  },
};

export default qrController;
