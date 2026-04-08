import { sendSuccessResponse } from '../../../utils/response.js';

import { dashboardService } from './service.js';

export const dashboardController = {
  getStats: async (req, res) => {
    const context = await dashboardService.resolveDashboardContext(
      req.user,
      req.query.adminId,
      req.query.outletId,
    );

    const data = context?.adminId
      ? await dashboardService.adminStats(context.adminId, context.outletId)
      : await dashboardService.superAdminStats();

    sendSuccessResponse(res, 200, 'Dashboard stats fetched successfully', data);
  },
  getSalesChart: async (req, res) => {
    const { startDate, endDate } = req.query;
    const context = await dashboardService.resolveDashboardContext(
      req.user,
      req.query.adminId,
      req.query.outletId,
      { requireForSuperadmin: true },
    );

    const data = await dashboardService.salesChart(
      context.adminId,
      context.outletId,
      startDate,
      endDate,
    );

    sendSuccessResponse(res, 200, 'Sales chart fetched', data);
  },
  getItemPerformance: async (req, res) => {
    const context = await dashboardService.resolveDashboardContext(
      req.user,
      req.query.adminId,
      req.query.outletId,
      { requireForSuperadmin: true },
    );
    const data = await dashboardService.itemPerformance(
      context.adminId,
      context.outletId,
    );
    sendSuccessResponse(res, 200, 'Item performance fetched', data);
  },
  getPeakTime: async (req, res) => {
    const { startDate, endDate } = req.query;
    const context = await dashboardService.resolveDashboardContext(
      req.user,
      req.query.adminId,
      req.query.outletId,
      { requireForSuperadmin: true },
    );

    const data = await dashboardService.peakTime(
      context.adminId,
      context.outletId,
      startDate,
      endDate,
    );

    sendSuccessResponse(res, 200, 'Peak time fetched', data);
  },
  getTopCustomers: async (req, res) => {
    const context = await dashboardService.resolveDashboardContext(
      req.user,
      req.query.adminId,
      req.query.outletId,
      { requireForSuperadmin: true },
    );
    const filter = { sortBy: req.query.sortBy };
    const data = await dashboardService.topCustomers(
      context.adminId,
      context.outletId,
      filter,
    );

    sendSuccessResponse(res, 200, 'Top customers fetched', data);
  },
  getTablePerformance: async (req, res) => {
    const context = await dashboardService.resolveDashboardContext(
      req.user,
      req.query.adminId,
      req.query.outletId,
      { requireForSuperadmin: true },
    );
    const data = await dashboardService.tablePerformance(
      context.adminId,
      context.outletId,
    );
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
    const context = await dashboardService.resolveDashboardContext(
      req.user,
      req.query.adminId,
      req.query.outletId,
      { requireForSuperadmin: true },
    );

    const [stats, sales, items, peakTime, tables, topCustomers] =
      await Promise.all([
        dashboardService.adminStats(context.adminId, context.outletId),
        dashboardService.salesChart(
          context.adminId,
          context.outletId,
          startDate,
          endDate,
        ),
        dashboardService.itemPerformance(context.adminId, context.outletId),
        dashboardService.peakTime(
          context.adminId,
          context.outletId,
          startDate,
          endDate,
        ),
        dashboardService.tablePerformance(context.adminId, context.outletId),
        dashboardService.topCustomers(context.adminId, context.outletId, {
          sortBy,
        }),
      ]);

    sendSuccessResponse(res, 200, 'Admin analytics fetched successfully', {
      adminId: context.adminId,
      outletId: context.outletId,
      stats,
      sales,
      items,
      peakTime,
      tables,
      topCustomers,
    });
  },
};
