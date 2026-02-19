import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

export const sendResetEmail = async (email, resetLink) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"Support Team" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Reset Your Password",
    html: `
      <div style="font-family: Arial, sans-serif;">
        <h2>Password Reset Request</h2>
        <p>Click the button below to reset your password:</p>
        <a href="${resetLink}" 
           style="padding:10px 20px; background:#007bff; color:white; text-decoration:none; border-radius:5px;">
           Reset Password
        </a>
        <p>This link will expire in 10 minutes.</p>
      </div>
    `,
  });
};