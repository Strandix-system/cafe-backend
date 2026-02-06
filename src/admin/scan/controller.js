import scanService from "./service.js";
import { sendSuccessResponse } from "../../../utils/response.js";
import { ApiError } from "../../../utils/apiError.js";

const scanController = {
  verifyScan: async (req, res, next) => {
    try {
      const token = req.params.token || req.query.token;

      if (!token) {
        return next(new ApiError(400, "Token is required"));
      }

      const result = await scanService.verifyScan(token);

      sendSuccessResponse(res, 200, "QR verified successfully", result);
    } catch (err) {
      next(err);
    }
  },
};

export default scanController;
