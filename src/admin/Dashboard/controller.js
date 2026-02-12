import DashboardService from "./service.js";
import { sendSuccessResponse } from "../../../utils/response.js";
export const Dashboard = async (req, res, next) => {
  try {
    const data = await DashboardService.superadminDashboardService();
    sendSuccessResponse(res, 200, "Dashboard data fetched successfully", data);
  } catch (err) {
    next(err);
  }
};
