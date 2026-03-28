import { sendSuccessResponse } from '../../../utils/response.js';
import { dashboardService } from './service.js';

export const dashboardController = {
  getStats: async (req, res) => {
    const adminId = await dashboardService.resolveDashboardAdminId(
      req.user,
      req.query.adminId,
    );

    const data = adminId
      ? await dashboardService.adminStats(adminId)
      : await dashboardService.superAdminStats();

    sendSuccessResponse(res, 200, 'Dashboard stats fetched successfully', data);
  },
  getSalesChart: async (req, res) => {
    const { startDate, endDate } = req.query;
    const adminId = await dashboardService.resolveDashboardAdminId(
      req.user,
      req.query.adminId,
      { requireForSuperadmin: true },
    );

    const data = await dashboardService.salesChart(adminId, startDate, endDate);

    sendSuccessResponse(res, 200, 'Sales chart fetched', data);
  },
  getItemPerformance: async (req, res) => {
    const adminId = await dashboardService.resolveDashboardAdminId(
      req.user,
      req.query.adminId,
      { requireForSuperadmin: true },
    );
    const data = await dashboardService.itemPerformance(adminId);
    sendSuccessResponse(res, 200, 'Item performance fetched', data);
  },
  getPeakTime: async (req, res) => {
    const { startDate, endDate } = req.query;
    const adminId = await dashboardService.resolveDashboardAdminId(
      req.user,
      req.query.adminId,
      { requireForSuperadmin: true },
    );

    const data = await dashboardService.peakTime(adminId, startDate, endDate);

    sendSuccessResponse(res, 200, 'Peak time fetched', data);
  },
  getTopCustomers: async (req, res) => {
    const adminId = await dashboardService.resolveDashboardAdminId(
      req.user,
      req.query.adminId,
      { requireForSuperadmin: true },
    );
    const filter = { sortBy: req.query.sortBy };
    const data = await dashboardService.topCustomers(adminId, filter);

    sendSuccessResponse(res, 200, 'Top customers fetched', data);
  },
  getTablePerformance: async (req, res) => {
    const adminId = await dashboardService.resolveDashboardAdminId(
      req.user,
      req.query.adminId,
      { requireForSuperadmin: true },
    );
    const data = await dashboardService.tablePerformance(adminId);
    sendSuccessResponse(res, 200, 'Table performance fetched', data);
  },
  getTopCafes: async (req, res) => {
    const filter = { sortBy: req.query.sortBy };
    const data = await dashboardService.topCafes(filter);

    sendSuccessResponse(res, 200, 'Top cafes fetched', data);
  },
  getPlatformSales: async (req, res) => {
    const { startDate, endDate } = req.query;
    const data = await dashboardService.platformSales(startDate, endDate);

    sendSuccessResponse(
      res,
      200,
      'Platform sales chart fetched successfully',
      data,
    );
  },
  getAdminAnalytics: async (req, res) => {
    const { startDate, endDate, sortBy } = req.query;
    const adminId = await dashboardService.resolveDashboardAdminId(
      req.user,
      req.query.adminId,
      { requireForSuperadmin: true },
    );

    const [stats, sales, items, peakTime, tables, topCustomers] =
      await Promise.all([
        dashboardService.adminStats(adminId),
        dashboardService.salesChart(adminId, startDate, endDate),
        dashboardService.itemPerformance(adminId),
        dashboardService.peakTime(adminId, startDate, endDate),
        dashboardService.tablePerformance(adminId),
        dashboardService.topCustomers(adminId, { sortBy }),
      ]);

    sendSuccessResponse(res, 200, 'Admin analytics fetched successfully', {
      adminId,
      stats,
      sales,
      items,
      peakTime,
      tables,
      topCustomers,
    });
  },
};
