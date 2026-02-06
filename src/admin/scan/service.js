import { verifyQrToken } from "../../../utils/qrToken.js";
import Qr from "../../../model/qr.js";
import { ApiError } from "../../../utils/apiError.js";

const scanService = {
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
};

export default scanService;
