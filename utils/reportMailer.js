import nodemailer from "nodemailer";
import { logger } from "../config/logger.js";

let cachedTransporter = null;
let cachedTransporterKey = "";

const getMailerConfig = () => {
  const user = process.env.EMAIL_SMTP || process.env.EMAIL_USER;
  const pass = process.env.PASS_SMTP || process.env.EMAIL_PASS;
  const service = process.env.REPORT_MAIL_SERVICE || "gmail";

  if (!user || !pass) {
    throw new Error(
      "Missing SMTP credentials. Set EMAIL_SMTP/PASS_SMTP or EMAIL_USER/EMAIL_PASS."
    );
  }

  return { user, pass, service };
};

const getTransporter = () => {
  const { user, pass, service } = getMailerConfig();
  const nextKey = `${service}|${user}`;

  if (cachedTransporter && cachedTransporterKey === nextKey) {
    return cachedTransporter;
  }

  cachedTransporter = nodemailer.createTransport({
    service,
    auth: {
      user,
      pass,
    },
  });
  cachedTransporterKey = nextKey;

  return cachedTransporter;
};

export const sendReportMail = async ({ to, subject, html, attachments = [] }) => {
  if (!to) {
    throw new Error("Recipient email is required to send report mail.");
  }
  if (!subject) {
    throw new Error("Email subject is required to send report mail.");
  }
  if (!html) {
    throw new Error("Email body is required to send report mail.");
  }

  const { user } = getMailerConfig();

  const mailOptions = {
    from: user,
    to,
    subject,
    html,
    attachments,
  };

  const info = await getTransporter().sendMail(mailOptions);
  logger.info(`[MonthlyRevenueJob] Report mail sent to ${to}: ${info.response}`);
  return info;
};
