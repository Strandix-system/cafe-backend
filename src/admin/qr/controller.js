import qrService from "./service.js";
import { sendSuccessResponse } from "../../../utils/response.js";
import { ApiError } from "../../../utils/apiError.js";
import { pick} from "../../../utils/pick.js";

const qrController = {

  createQr: async (req, res, next) => {
    try {

      const { totalTables, layoutId } = req.body;

      if (!totalTables || totalTables < 1) {
        return next(new ApiError(400, "totalTables is required"));
      }

      const result = await qrService.createBulkQr(
        req.user._id,
        totalTables,
        layoutId
      );

      sendSuccessResponse(
        res,
        201,
        "QRs created successfully",
        result
      );

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
  verifyScan: async (req, res, next) => {
    try {
      const token = decodeURIComponent(req.query.token);

      if (!token) {
        return next(new ApiError(400, "Token is required"));
      }

      const result = await qrService.verifyScan(token);

      sendSuccessResponse(res, 200, "QR verified successfully", result);
    } catch (err) {
      next(err);
    }
  },
  getAllQr: async (req, res, next) => {
    try {
      const filter = pick(req.query, ["search"]);
      const options = pick(req.query, ['page', 'limit', 'sortBy', 'populate']);

      const adminId = req.user._id;

      const result = await qrService.getAllQr(adminId, filter, options);

      sendSuccessResponse(
        res,
        200,
        "All QRs fetched successfully",
        result
      );

    } catch (err) {
      next(err);
    }
  },


};

export default qrController;
