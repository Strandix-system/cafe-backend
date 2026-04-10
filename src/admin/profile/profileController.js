import { sendSuccessResponse } from '../../../utils/response.js';

import profileService from './profileService.js';

const profileController = {
  getMyProfile: async (req, res) => {
    const result = await profileService.getMyProfile(req.user._id);
    sendSuccessResponse(res, 200, 'Profile fetched successfully', result);
  },
  updateMyProfile: async (req, res) => {
    const result = await profileService.updateMyProfile(
      req.user._id,
      req.body,
      req.file,
    );
    sendSuccessResponse(res, 200, 'Profile updated successfully', result);
  },
  deleteProfileImage: async (req, res) => {
    const result = await profileService.deleteProfileImage(req.user._id);
    sendSuccessResponse(res, 200, result.message);
  },
};

export default profileController;
