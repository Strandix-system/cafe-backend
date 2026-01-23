import DashboardService from "./service.js";

export const Dashboard = async (req, res, next) => {
  try {
    const data = await DashboardService.superadminDashboardService();
    res.json(data);
  } catch (err) {
    next(err);
  }
};
