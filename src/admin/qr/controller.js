import qrService from "./service.js";
import { sendSuccessResponse } from "../../../utils/response.js";

const qrController = {

  createQr: async (req, res, next) => {
    try {

      const { tableNumber, layoutId } = req.body;

      const qr = await qrService.createQr(
        req.user._id,
        tableNumber,
        layoutId
      );

      sendSuccessResponse(res, 201, "QR created", qr);

    } catch (err) {
      next(err);
    }
  },
  getMyQrs: async (req, res, next) => {
    try {

      const result = await qrService.getMyQrs(req.user._id);

      sendSuccessResponse(res, 200, "QR list", result);

    } catch (err) {
      next(err);
    }
  },
  deleteQr: async (req, res, next) => {
    try {

      await qrService.deleteQr(req.params.id, req.user._id);

      sendSuccessResponse(res, 200, "QR deleted");

    } catch (err) {
      next(err);
    }
  },
};

export default qrController;
