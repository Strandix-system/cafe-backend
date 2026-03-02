import dashboardService from "./service.js";
import { sendSuccessResponse } from "../../../utils/response.js";

const dashboardController = {

  getStats: async (req, res, next) => {
    try {
      let data;

      const adminId = await dashboardService.resolveTargetAdminId(
        req.user,
        req.query.adminId
      );

      if (adminId) {
        data = await dashboardService.adminStats(adminId);
      } else {
        data = await dashboardService.superAdminStats();
      }

      sendSuccessResponse(res, 200, "Dashboard stats fetched successfully", data);
    } catch (err) {
      next(err);
    }
  },
  getSalesChart: async (req, res, next) => {
    try {
      const { startDate, endDate } = req.query;
      const adminId = await dashboardService.resolveTargetAdminId(
        req.user,
        req.query.adminId,
        { requireForSuperadmin: true }
      );

      const data = await dashboardService.salesChart(
        adminId,
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
      const adminId = await dashboardService.resolveTargetAdminId(
        req.user,
        req.query.adminId,
        { requireForSuperadmin: true }
      );
      const data = await dashboardService.itemPerformance(adminId);
      sendSuccessResponse(res, 200, "Item performance fetched", data);
    } catch (err) {
      next(err);
    }
  },
  getPeakTime: async (req, res, next) => {
    try {
      const { startDate, endDate } = req.query;
      const adminId = await dashboardService.resolveTargetAdminId(
        req.user,
        req.query.adminId,
        { requireForSuperadmin: true }
      );

      const data = await dashboardService.peakTime(
        adminId,
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
      const adminId = await dashboardService.resolveTargetAdminId(
        req.user,
        req.query.adminId,
        { requireForSuperadmin: true }
      );
      const data = await dashboardService.topCustomers(adminId);

      sendSuccessResponse(res, 200, "Top customers fetched", data);
    } catch (err) {
      next(err);
    }
  },
  getTablePerformance: async (req, res, next) => {
    try {
      const adminId = await dashboardService.resolveTargetAdminId(
        req.user,
        req.query.adminId,
        { requireForSuperadmin: true }
      );
      const data = await dashboardService.tablePerformance(adminId);
      sendSuccessResponse(res, 200, "Table performance fetched", data);
    } catch (err) {
      next(err);
    }
  },
  getTopCafes: async (req, res, next) => {
    try {
      const data = await dashboardService.topCafes();

      sendSuccessResponse(res, 200, "Top cafes fetched", data);
    } catch (err) {
      next(err);
    }
  },
  getPlatformSales: async (req, res, next) => {
    try {
      const { startDate, endDate } = req.query;

      const data = await dashboardService.platformSales(
        startDate,
        endDate
      );

      sendSuccessResponse(res, 200, "Platform sales chart fetched successfully", data);
    } catch (err) {
      next(err);
    }
  },
  getAdminAnalytics: async (req, res, next) => {
    try {
      const { startDate, endDate } = req.query;
      const adminId = await dashboardService.resolveTargetAdminId(
        req.user,
        req.query.adminId,
        { requireForSuperadmin: true }
      );

      const [
        stats,
        sales,
        items,
        peakTime,
        tables,
        topCustomers
      ] = await Promise.all([
        dashboardService.adminStats(adminId),
        dashboardService.salesChart(adminId, startDate, endDate),
        dashboardService.itemPerformance(adminId),
        dashboardService.peakTime(adminId, startDate, endDate),
        dashboardService.tablePerformance(adminId),
        dashboardService.topCustomers(adminId)
      ]);

      sendSuccessResponse(res, 200, "Admin analytics fetched successfully", {
        adminId,
        stats,
        sales,
        items,
        peakTime,
        tables,
        topCustomers
      });
    } catch (err) {
      next(err);
    }
  },
};

export default dashboardController;