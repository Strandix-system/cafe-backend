import http from "http";

import app from "./app.js";
import { initSocket } from "./socket.js";
import connectDB from "./database/dbConnect.js";
import { startMonthlyRevenueReportJob } from "./src/jobs/monthlyRevenueReport.job.js";


const port = process.env.PORT || 8080;

const server = http.createServer(app);

const startServer = async () => {
  await connectDB();

  initSocket(server);

  if (process.env.ENABLE_MONTHLY_REVENUE_CRON !== "false") {
    startMonthlyRevenueReportJob();
  }

  server.listen(port, "0.0.0.0", () => {
    console.log(`Server running on port ${port}`);
  });
};

startServer();
