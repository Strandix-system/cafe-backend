import User from '../../../model/user.js';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { s3 } from '../../../config/s3.js';
import { deleteSingleFile } from '../../../utils/s3utils.js';
import { ApiError } from '../../../utils/apiError.js';

const profileService = {
  getMyProfile: async (userId) => {
    const user = await User.findById(userId).select(
      'firstName lastName email phoneNumber profileImage role socialLinks hours',
    );
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    return user;
  },
  updateMyProfile: async (userId, body, file) => {
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, 'User not found');
    for (const field of ['email', 'phoneNumber']) {
      if (body[field] && body[field] !== user[field]) {
        const exists = await User.findOne({ [field]: body[field] });
        if (exists) throw new ApiError(409, `${field} already in use`);
      }
    }
    if (body.email && body.email !== user.email) {
      const emailExists = await User.findOne({ email: body.email });
      if (emailExists) {
        throw new ApiError(409, 'Email already in use');
      }
    }
    if (body.phoneNumber && body.phoneNumber !== user.phoneNumber) {
      const phoneExists = await User.findOne({ phoneNumber: body.phoneNumber });
      if (phoneExists) {
        throw new ApiError(409, 'Phone number already in use');
      }
    }
    if (file?.location) {
      if (user.profileImage)
        await deleteSingleFile(user.profileImage).catch(() => null);
      body.profileImage = file.location;
    }
    Object.assign(user, body);
    await user.save();
    const result = user.toObject();
    delete result.password;
    return result;
  },
  deleteProfileImage: async (userId) => {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    if (!user.profileImage) {
      throw new ApiError(400, 'Profile image not found');
    }
    const key = user.profileImage.split('.amazonaws.com/')[1];
    await s3.send(
      new DeleteObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: key,
      }),
    );
    user.profileImage = null;
    await user.save();
    return {
      message: 'Profile image deleted successfully',
    };
  },
};

export default profileService;
