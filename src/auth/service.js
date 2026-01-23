import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../../model/user.js";

const authService = {
  register: async (data) => {
    const { email, password, role = "superadmin" } = data;

    const exists = await User.findOne({ email });
    if (exists) {
      throw new Error("User already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password: hashedPassword,
      role
    });

    return {
      id: user._id,
      email: user.email,
      role: user.role
    };
  },

 login: async (data) => {
  const { email, phoneNumber, password } = data;

  if ((!email && !phoneNumber) || !password) {
    throw new Error("Email or phoneNumber and password are required");
  }

  const user = await User.findOne({
    $or: [
      email ? { email } : null,
      phoneNumber ? { phoneNumber } : null,
    ].filter(Boolean),
  });

  if (!user) {
    throw new Error("Invalid credentials");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Invalid credentials");
  }

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  return {
    token,
    role: user.role,
  };
},

  
  logout: async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  user.tokenVersion += 1;
  await user.save();

  return { message: "Logged out successfully" };
}

};

export default authService;
