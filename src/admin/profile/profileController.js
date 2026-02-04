import profileService from "./profileService.js";
import  {sendSuccessResponse } from "../../../utils/response.js";

const profileController = {
  // ✅ GET PROFILE
  getMyProfile: async (req, res, next) => {
    try {
      const result = await profileService.getMyProfile(req.user._id);
      sendSuccessResponse(res, 200, "Profile fetched successfully", result);
    } catch (error) {
      next(error);
    }
  },

  // ✅ UPDATE PROFILE
  updateMyProfile: async (req, res, next) => {
    try {
      const result = await profileService.updateMyProfile(
        req.user._id,
        req.body,
        req.file
      );
      sendSuccessResponse(res, 200, "Profile updated successfully", result);
    } catch (error) {
      next(error);
    }
  },
};

export default profileController;
