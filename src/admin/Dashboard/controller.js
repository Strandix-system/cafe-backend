import dashboardService from "./service.js";

export const getDashboardStats = async (req, res) => {
  try {
    const user = req.user; // from tokenVerification

    let data;

    // Super Admin
    if (user.role === "superadmin") {
      data = await dashboardService.superAdminStats();

    // Admin
    } else if (user.role === "admin") {
      data = await dashboardService.adminStats(user._id);

    } else {
      return res.status(403).json({
        success: false,
        message: "Access Denied",
      });
    }

    res.status(200).json({
      success: true,
      role: user.role,
      data,
    });

  } catch (error) {
    console.error("Dashboard Error:", error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
