import User from "../../../model/user.js";

const DashboardService = {
  superadminDashboardService: async () => {
    const totalAdmins = await User.countDocuments({ role: "admin" });

    return {
      admins: {
        totalAdmins,
      },
    };
  },
};

export default DashboardService;
