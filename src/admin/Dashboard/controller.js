import dashboardService from "./service.js";
import { sendSuccessResponse } from "../../../utils/response.js";

const dashboardController = {

  getStats: async (req, res, next) => {
    try {
      const user = req.user;
      let data;

      if (user.role === "admin") {
        data = await dashboardService.adminStats(user._id);
      }
      else if (user.role === "superadmin") {
        data = await dashboardService.superAdminStats();
      }
      else {
        return res.status(403).json({ message: "Access Denied" });
      }
      sendSuccessResponse(res, 200, "Dashboard stats fetched successfully", data);
    } catch (err) {
      next(err);
    }
  },
  getSalesChart: async (req, res, next) => {
    try {
      const { startDate, endDate } = req.query;

      const data = await dashboardService.salesChart(
        req.user._id,
        startDate,
        endDate
      );
      sendSuccessResponse(res, 200, "Sales chart fetched", data);
    } catch (err) {
      next(err);
    }
  },
  getItemPerformance: async (req, res, next) => {
    try {
      const data = await dashboardService.itemPerformance(req.user._id);
      sendSuccessResponse(res, 200, "Item performance fetched", data);
    } catch (err) {
      next(err);
    }
  },
  getPeakTime: async (req, res, next) => {
    try {
      const { startDate, endDate } = req.query;

      const data = await dashboardService.peakTime(
        req.user._id,
        startDate,
        endDate
      );
      sendSuccessResponse(res, 200, "Peak time fetched", data);
    } catch (err) {
      next(err);
    }
  },
  getTopCustomers: async (req, res, next) => {
    try {
      const data = await dashboardService.topCustomers(req.user._id);

      sendSuccessResponse( res,200,"Top customers fetched",data);
    } catch (err) {
      next(err);
    }
  },
  getTablePerformance: async (req, res, next) => {
    try {
      const data = await dashboardService.tablePerformance(req.user._id);
      sendSuccessResponse(res, 200, "Table performance fetched", data);
    } catch (err) {
      next(err);
    }
  },
  getTopCafes: async (req, res, next) => {
    try {
      const data = await dashboardService.topCafes();

      sendSuccessResponse(res,200,"Top cafes fetched",data);
    } catch (err) {
      next(err);
    }
  },
};

export default dashboardController;
