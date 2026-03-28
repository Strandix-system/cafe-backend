import moment from "moment-timezone";
import User from "../../model/user.js";
import Order from "../../model/order.js";
import { logger } from "../../config/logger.js";
import { sendReportMail } from "../../utils/reportMailer.js";
import { buildMonthlyRevenueWorkbook } from "./monthlyRevenueReport.excel.js";

const REPORT_TIMEZONE = process.env.MONTHLY_REVENUE_TZ || "Asia/Kolkata";

const sanitizeFilePart = (value) =>
  String(value ?? "cafe")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "cafe";

const round2 = (value) => Number((value || 0).toFixed(2));

const getTargetEmails = () =>
  (process.env.MONTHLY_REVENUE_TARGET_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

const buildAdminFilter = (targetEmails = []) => ({
  role: "admin",
  isActive: true,
  email: { $exists: true, $ne: null },
  ...(targetEmails.length ? { email: { $in: targetEmails } } : {}),
});

const getReportWindows = (referenceDate = new Date(), timezone = REPORT_TIMEZONE) => {
  const now = moment.tz(referenceDate, timezone);
  const reportStart = now.clone().startOf("month").subtract(1, "month");
  const reportEnd = reportStart.clone().endOf("month");
  const previousStart = reportStart.clone().subtract(1, "month").startOf("month");
  const previousEnd = previousStart.clone().endOf("month");

  return {
    reportMonthLabel: reportStart.format("MMMM YYYY"),
    reportMonthCompactLabel: reportStart.format("MMM-YYYY"),
    reportStartUtc: reportStart.clone().utc().toDate(),
    reportEndUtc: reportEnd.clone().utc().toDate(),
    previousStartUtc: previousStart.clone().utc().toDate(),
    previousEndUtc: previousEnd.clone().utc().toDate(),
    reportStartLocal: reportStart,
    reportEndLocal: reportEnd,
  };
};

const aggregateAdminMonthStats = async (start, end) =>
  Order.aggregate([
    {
      $match: {
        isCompleted: true,
        createdAt: {
          $gte: start,
          $lte: end,
        },
      },
    },
    {
      $group: {
        _id: "$adminId",
        revenue: { $sum: "$totalAmount" },
        completedOrders: { $sum: 1 },
        paidOrders: {
          $sum: {
            $cond: [{ $eq: ["$paymentStatus", true] }, 1, 0],
          },
        },
        averageOrderValue: { $avg: "$totalAmount" },
      },
    },
    { $sort: { revenue: -1 } },
  ]);

const aggregateAdminDailyStats = async (start, end) =>
  Order.aggregate([
    {
      $match: {
        isCompleted: true,
        createdAt: {
          $gte: start,
          $lte: end,
        },
      },
    },
    {
      $group: {
        _id: {
          adminId: "$adminId",
          date: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
              timezone: REPORT_TIMEZONE,
            },
          },
        },
        completedOrders: { $sum: 1 },
        revenue: { $sum: "$totalAmount" },
      },
    },
    { $sort: { "_id.date": 1 } },
  ]);

const calculateGrowthPercent = (currentRevenue, previousRevenue) => {
  if (previousRevenue <= 0) {
    return currentRevenue > 0 ? 100 : 0;
  }
  return round2(((currentRevenue - previousRevenue) / previousRevenue) * 100);
};

const createMonthDateList = (startLocalMoment, endLocalMoment) => {
  const dates = [];
  const cursor = startLocalMoment.clone().startOf("day");
  const end = endLocalMoment.clone().startOf("day");

  while (cursor.isSameOrBefore(end, "day")) {
    dates.push(cursor.format("YYYY-MM-DD"));
    cursor.add(1, "day");
  }

  return dates;
};

const buildIndustrySnapshot = (monthlyStats, adminDirectory, rankMap, adminId, adminRevenue) => {
  const platformRevenue = monthlyStats.reduce((sum, row) => sum + (row.revenue || 0), 0);
  const platformOrders = monthlyStats.reduce(
    (sum, row) => sum + (row.completedOrders || 0),
    0
  );
  const cafesWithSales = monthlyStats.length;
  const averageRevenuePerCafe = cafesWithSales > 0 ? platformRevenue / cafesWithSales : 0;
  const platformAverageOrderValue = platformOrders > 0 ? platformRevenue / platformOrders : 0;

  const topEntry = monthlyStats[0];
  const topCafe =
    topEntry && adminDirectory.get(String(topEntry._id))
      ? adminDirectory.get(String(topEntry._id))
      : null;

  const rank = rankMap.get(String(adminId)) || null;
  const revenueSharePercent =
    platformRevenue > 0 ? round2((adminRevenue / platformRevenue) * 100) : 0;

  return {
    platformRevenue: round2(platformRevenue),
    platformOrders,
    cafesWithSales,
    averageRevenuePerCafe: round2(averageRevenuePerCafe),
    platformAverageOrderValue: round2(platformAverageOrderValue),
    topCafeName: topCafe?.cafeName || "N/A",
    topCafeRevenue: round2(topEntry?.revenue || 0),
    rankLabel: rank ? `${rank}` : "N/A",
    revenueSharePercent,
  };
};

const toIdMap = (rows = []) => new Map(rows.map((row) => [String(row._id), row]));

const buildDailyMap = (dailyStats = []) => {
  const dailyMap = new Map();

  for (const row of dailyStats) {
    const adminId = String(row._id.adminId);
    if (!dailyMap.has(adminId)) {
      dailyMap.set(adminId, new Map());
    }

    dailyMap.get(adminId).set(row._id.date, {
      completedOrders: row.completedOrders || 0,
      revenue: row.revenue || 0,
    });
  }

  return dailyMap;
};

const buildReportSummary = (monthRow, previousMonthRow) => {
  const revenue = round2(monthRow?.revenue || 0);
  const previousRevenue = round2(previousMonthRow?.revenue || 0);

  return {
    revenue,
    completedOrders: monthRow?.completedOrders || 0,
    paidOrders: monthRow?.paidOrders || 0,
    averageOrderValue: round2(monthRow?.averageOrderValue || 0),
    previousRevenue,
    growthPercent: calculateGrowthPercent(revenue, previousRevenue),
  };
};

const buildDailyBreakdown = (adminDaily, monthDates) =>
  monthDates.map((date) => ({
    date,
    completedOrders: adminDaily.get(date)?.completedOrders || 0,
    revenue: round2(adminDaily.get(date)?.revenue || 0),
  }));

const buildEmailHtml = ({ reportMonthLabel, firstName, cafeName, revenue, completedOrders }) => `
  <div style="font-family: Arial, sans-serif; color: #1f2937;">
    <h2>Monthly Revenue Report - ${reportMonthLabel}</h2>
    <p>Hello ${firstName},</p>
    <p>Your cafe report is attached as an Excel file.</p>
    <p><strong>Cafe:</strong> ${cafeName}</p>
    <p><strong>Total Revenue:</strong> INR ${revenue.toLocaleString("en-IN")}</p>
    <p><strong>Completed Orders:</strong> ${completedOrders}</p>
    <p>Regards,<br/>Cafe Backend</p>
  </div>
`;

const buildReportFilename = ({ cafeName, firstName, reportMonthCompactLabel }) => {
  const fileKey = sanitizeFilePart(cafeName || firstName);
  return `monthly-revenue-${fileKey}-${reportMonthCompactLabel}.xls`;
};

const sendAdminMonthlyReport = async ({
  admin,
  reportMonthLabel,
  reportMonthCompactLabel,
  summary,
  industrySnapshot,
  dailyBreakdown,
}) => {
  const workbookBuffer = buildMonthlyRevenueWorkbook({
    admin,
    reportMonthLabel,
    summary,
    industry: industrySnapshot,
    dailyBreakdown,
  });

  const subject = `Monthly Revenue Report - ${reportMonthLabel}`;
  const cafeName = admin.cafeName || `${admin.firstName} ${admin.lastName}`;
  const html = buildEmailHtml({
    reportMonthLabel,
    firstName: admin.firstName,
    cafeName,
    revenue: summary.revenue,
    completedOrders: summary.completedOrders,
  });
  const reportFilename = buildReportFilename({
    cafeName: admin.cafeName,
    firstName: admin.firstName,
    reportMonthCompactLabel,
  });

  await sendReportMail({
    to: admin.email,
    subject,
    html,
    attachments: [
      {
        filename: reportFilename,
        content: workbookBuffer,
        contentType: "application/vnd.ms-excel",
      },
    ],
  });

  logger.info(
    `[MonthlyRevenueJob] MonthlyRevenue Excel sent to admin ${admin.email} (${reportFilename})`
  );
};

export const dispatchMonthlyRevenueReports = async ({
  triggeredBy = "cron",
  referenceDate = new Date(),
} = {}) => {
  const reportWindow = getReportWindows(referenceDate);
  const {
    reportMonthLabel,
    reportMonthCompactLabel,
    reportStartUtc,
    reportEndUtc,
    previousStartUtc,
    previousEndUtc,
    reportStartLocal,
    reportEndLocal,
  } = reportWindow;

  logger.info(
    `[MonthlyRevenueJob] Triggered by ${triggeredBy}. Preparing report for ${reportMonthLabel}.`
  );

  const adminFilter = buildAdminFilter(getTargetEmails());
  const [admins, monthlyStats, previousMonthStats, dailyStats] = await Promise.all([
    User.find(adminFilter).select("_id firstName lastName cafeName email"),
    aggregateAdminMonthStats(reportStartUtc, reportEndUtc),
    aggregateAdminMonthStats(previousStartUtc, previousEndUtc),
    aggregateAdminDailyStats(reportStartUtc, reportEndUtc),
  ]);

  if (admins.length === 0) {
    logger.info("[MonthlyRevenueJob] No active admins with email found.");
    return {
      totalAdmins: 0,
      sentCount: 0,
      failedCount: 0,
      reportMonthLabel,
    };
  }

  const adminDirectory = toIdMap(admins);
  const monthlyMap = toIdMap(monthlyStats);
  const previousMap = toIdMap(previousMonthStats);
  const rankMap = new Map(monthlyStats.map((row, index) => [String(row._id), index + 1]));
  const dailyMap = buildDailyMap(dailyStats);
  const monthDates = createMonthDateList(reportStartLocal, reportEndLocal);

  let sentCount = 0;
  let failedCount = 0;

  for (const admin of admins) {
    try {
      const adminId = String(admin._id);
      const monthRow = monthlyMap.get(adminId);
      const previousMonthRow = previousMap.get(adminId);
      const summary = buildReportSummary(monthRow, previousMonthRow);
      const adminDaily = dailyMap.get(adminId) || new Map();
      const dailyBreakdown = buildDailyBreakdown(adminDaily, monthDates);
      const industrySnapshot = buildIndustrySnapshot(
        monthlyStats,
        adminDirectory,
        rankMap,
        adminId,
        summary.revenue
      );

      await sendAdminMonthlyReport({
        admin,
        reportMonthLabel,
        reportMonthCompactLabel,
        summary,
        industrySnapshot,
        dailyBreakdown,
      });

      sentCount += 1;
    } catch (error) {
      failedCount += 1;
      logger.error(
        `[MonthlyRevenueJob] Failed report for admin ${admin?._id}: ${error?.message}`
      );
    }
  }

  logger.info(
    `[MonthlyRevenueJob] Completed. Sent=${sentCount}, Failed=${failedCount}, Month=${reportMonthLabel}`
  );

  return {
    totalAdmins: admins.length,
    sentCount,
    failedCount,
    reportMonthLabel,
  };
};
