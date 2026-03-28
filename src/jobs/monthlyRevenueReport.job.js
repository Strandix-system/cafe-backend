import cron from "node-cron";
import { logger } from "../../config/logger.js";
import { dispatchMonthlyRevenueReports } from "../reports/monthlyRevenueReport.service.js";

const CRON_EXPRESSION = process.env.MONTHLY_REVENUE_CRON || "0 9 1 * *";
const CRON_TIMEZONE = process.env.MONTHLY_REVENUE_TZ || "Asia/Kolkata";

let monthlyRevenueJob = null;

export const startMonthlyRevenueReportJob = () => {
  if (monthlyRevenueJob) {
    return monthlyRevenueJob;
  }

  if (!cron.validate(CRON_EXPRESSION)) {
    logger.error(
      `[MonthlyRevenueJob] Invalid cron expression: ${CRON_EXPRESSION}. Job not started.`
    );
    return null;
  }

  monthlyRevenueJob = cron.schedule(
    CRON_EXPRESSION,
    async () => {
      try {
        await dispatchMonthlyRevenueReports({ triggeredBy: "cron" });
      } catch (error) {
        logger.error(`[MonthlyRevenueJob] Cron execution failed: ${error?.message}`);
      }
    },
    { timezone: CRON_TIMEZONE }
  );

  logger.info(
    `[MonthlyRevenueJob] Started. cron="${CRON_EXPRESSION}" timezone="${CRON_TIMEZONE}"`
  );

  if (process.env.RUN_MONTHLY_REVENUE_ON_STARTUP === "true") {
    dispatchMonthlyRevenueReports({ triggeredBy: "startup" }).catch((error) => {
      logger.error(`[MonthlyRevenueJob] Startup run failed: ${error?.message}`);
    });
  }

  return monthlyRevenueJob;
};

export const stopMonthlyRevenueReportJob = () => {
  if (monthlyRevenueJob) {
    monthlyRevenueJob.stop();
    monthlyRevenueJob = null;
    logger.info("[MonthlyRevenueJob] Stopped.");
  }
};

