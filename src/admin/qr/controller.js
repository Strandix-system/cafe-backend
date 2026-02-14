import qrService from "./service.js";
import { pick } from "../../../utils/pick.js";
import { sendSuccessResponse } from "../../../utils/response.js";
import { get } from "http";

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
  getAllQr: async (req, res, next) => {
    try {
      const filter = { ...pick(req.query, ["tableNumber", "layoutId"])};

      const options = {...pick(req.query, ["page", "limit", "populate"]),
        sortBy: "tableNumber:asc",
      };
      const result = await qrService.getAllQr(filter, options);

      sendSuccessResponse(res, 200, "QR codes fetched", result);
    } catch (error) {
      next(error);
    }
  },
  getQrCountforLayout: async (req, res, next) => {
    try {
      const { layoutId } = req.params;
      const count = await qrService.getQrCountforLayout(layoutId);
      sendSuccessResponse(res, 200, "QR count fetched", { count });
    } catch (error) {
      next(error);
    }
},
};

export default qrController;