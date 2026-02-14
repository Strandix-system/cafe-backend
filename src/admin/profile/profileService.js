import User from "../../../model/user.js";

const profileService = {
  getMyProfile: async (userId) => {
    const user = await User.findById(userId).select(
      "firstName lastName email phoneNumber profileImage role socialLinks hours"
    );
    if (!user) {
      const err = new Error("User not found");
      err.statusCode = 404;
      throw err;
    }
    return user;
  },
  updateMyProfile: async (userId, body, file) => {
    const user = await User.findById(userId);
    if (!user) throw Object.assign(new Error("User not found"), { statusCode: 404 });
    for (const field of ['email', 'phoneNumber']) {
      if (body[field] && body[field] !== user[field]) {
        const exists = await User.findOne({ [field]: body[field] });
        if (exists) throw Object.assign(new Error(`${field} already in use`), { statusCode: 409 });
      }
    }
    if (body.email && body.email !== user.email) {
      const emailExists = await User.findOne({ email: body.email });
      if (emailExists) {
        throw Object.assign(new Error("Email already in use"), { statusCode: 409 });
      }
    }
    if (body.phoneNumber && body.phoneNumber !== user.phoneNumber) {
      const phoneExists = await User.findOne({ phoneNumber: body.phoneNumber });
      if (phoneExists) {
        throw Object.assign(new Error("Phone number already in use"), { statusCode: 409 });
      }
    }
    if (file?.location) {
      if (user.profileImage) await deleteSingleFile(user.profileImage).catch(() => null);
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
      const err = new Error("User not found");
      err.statusCode = 404;
      throw err;
    }
    if (!user.profileImage) {
      const err = new Error("Profile image not found");
      err.statusCode = 400;
      throw err;
    }
    const key = user.profileImage.split(".amazonaws.com/")[1];
    await s3.send(
      new DeleteObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: key,
      })
    );
    user.profileImage = null;
    await user.save();
    return {
      message: "Profile image deleted successfully",
    };
  },
};

export default profileService;
