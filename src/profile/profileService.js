import User from "../../model/user.js";

const profileService = {
  // ✅ GET MY PROFILE
  getMyProfile: async (userId) => {
    const user = await User.findById(userId).select(
      "firstName lastName email phoneNumber profileImage role"
    );

    if (!user) {
      const err = new Error("User not found");
      err.statusCode = 404;
      throw err;
    }

    return user;
  },

  // ✅ UPDATE MY PROFILE
  updateMyProfile: async (userId, body, file) => {
    const user = await User.findById(userId);
    if (!user) {
      const err = new Error("User not found");
      err.statusCode = 404;
      throw err;
    }

    const { firstName, lastName, email, phoneNumber } = body;

    // Email uniqueness
    if (email && email !== user.email) {
      const exists = await User.findOne({ email });
      if (exists) {
        const err = new Error("Email already in use");
        err.statusCode = 409;
        throw err;
      }
    }

    // Phone uniqueness
    if (phoneNumber && phoneNumber !== user.phoneNumber) {
      const exists = await User.findOne({ phoneNumber });
      if (exists) {
        const err = new Error("Phone number already in use");
        err.statusCode = 409;
        throw err;
      }
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email;
    if (phoneNumber) user.phoneNumber = phoneNumber;

    // 🔥 Profile Image (S3)
    if (file) {
      user.profileImage = file.location;
    }

    await user.save();

    return {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      profileImage: user.profileImage,
      role: user.role,
    };
  },
};

export default profileService;
