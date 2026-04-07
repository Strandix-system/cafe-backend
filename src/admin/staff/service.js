import Staff from '../../../model/staff.js';
import { ApiError } from '../../../utils/apiError.js';
import { deleteSingleFile } from '../../../utils/s3utils.js';

export const staffService = {
  createStaff: async (data, adminUser, file) => {
    const adminId = adminUser?._id;
    if (!adminId) {
      throw new ApiError(401, 'Unauthorized');
    }
    const profileImage = file?.location || file?.key || null;
    const staff = await Staff.create({
      ...data,
      adminId,
      profileImage,
    });
    return staff;
  },

  listStaff: async (adminId, filter, options) => {
    if (!adminId) {
      throw new ApiError(401, 'Unauthorized');
    }
    if (filter.isActive !== undefined) {
      filter.isActive = filter.isActive === 'true';
    }
    return await Staff.paginate({ adminId, ...filter }, options);
  },

  updateStaff: async (staffId, data, file, adminUser) => {
    const adminId = adminUser?._id;
    if (!adminId) {
      throw new ApiError(401, 'Unauthorized');
    }

    const staff = await Staff.findById(staffId);
    if (!staff || staff.adminId?.toString() !== adminId.toString()) {
      throw new ApiError(404, 'Staff not found');
    }

    const { profileImage: bodyProfileImage, ...rest } = data ?? {};
    const update = Object.fromEntries(
      Object.entries(rest).filter(([, value]) => value !== undefined),
    );

    const nextProfileImage = file?.location ?? bodyProfileImage;
    if (!Object.keys(update).length && nextProfileImage === undefined) {
      throw new ApiError(400, 'No updates provided');
    }

    const oldProfileImage = staff.profileImage;

    staff.set(update);
    if (nextProfileImage !== undefined) {
      staff.profileImage = nextProfileImage;
    }
    await staff.save();

    if (
      nextProfileImage !== undefined &&
      oldProfileImage &&
      oldProfileImage !== staff.profileImage
    ) {
      await deleteSingleFile(oldProfileImage).catch((err) => {
        console.error(
          '❌ Failed to delete old staff profileImage:',
          err.message,
        );
      });
    }

    return staff;
  },
};
