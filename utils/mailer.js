import nodemailer from "nodemailer";
import { CONSTANTS } from "./constants.js";
import { promises as fs } from 'fs';
import { logger } from "../config/logger.js";

let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_SMTP,
        pass: process.env.PASS_SMTP
    }
});

var sendMail = async (mailOptions) => {
    try {
        const info = await transporter.sendMail(mailOptions);
        logger.info(info.response)
        console.log('Email sent: ' + info.response);
    } catch (error) {
        logger.error(error)
        console.log(error, 'error');
    };
};

export default {
    sendOtp: (email, otp, subject) => {
        var mailOptions = {
            from: process.env.EMAIL_SMTP,
            to: email,
            subject,
            html: `<h1>Your otp is ${otp}</h1>`
        };
        sendMail(mailOptions);
    },
    mailSend: async (emailRequest) => {
        var subject;
        var mailMessage;
        var emailTemplate;
        if (emailRequest.template === CONSTANTS.DRIVERS.SIGNUP) {
            subject = 'Welcome to Pax';
            emailTemplate = './templates/welcome-driver.html';
        } else if (emailRequest.template === CONSTANTS.RIDERS.SIGNUP) {
            subject = 'Welcome to Pax';
            emailTemplate = './templates/welcome-rider.html';
        } else if (emailRequest.template === CONSTANTS.ADMIN.ADD) {
            subject = 'Welcome to Pax';
            emailTemplate = './templates/welcome-admin.html';
        } else if (emailRequest.template === CONSTANTS.APPREPORT.BUG) {
            subject = "Bug Report";
            mailMessage = emailRequest?.description;
        } else if (emailRequest.template === CONSTANTS.DRIVERS.VERIFIED) {
            subject = 'Account Verified!';
            mailMessage = emailRequest.description
        } else if (emailRequest.template === CONSTANTS.SUPPORT.SUPPORTCREATE) {
            subject = "Support Request";
            mailMessage = emailRequest?.description;
        } else if (emailRequest.template === CONSTANTS.RIDES.ACCEPTEDNOW) {
            subject = "SUCCESS! Ride Accepted";
            emailTemplate = './templates/Ride-accepted-now.html';
        } else if (emailRequest.template === CONSTANTS.DRIVERS.SCHEDULERIDE) {
            subject = 'You got a Schedule Ride';
            mailMessage = emailRequest?.description
        } else if (emailRequest.template === CONSTANTS.ADMIN.SCHEDULERIDEMAIL) {
            subject = 'Schedule Rides';
            mailMessage = emailRequest?.description;
        } else if (emailRequest.template === CONSTANTS.RIDES.CANCELLEDBYRIDER) {
            subject = 'Ride Cancelled!';
            emailTemplate = './templates/Ride-cancelled-by-ride.html';
        } else if (emailRequest.template === CONSTANTS.RIDES.COMPLETED) {
            subject = 'Ride Completed!';
            emailTemplate = './templates/Ride-completed.html';
        } else if (emailRequest.template === CONSTANTS.RIDES.ACCEPTEDSCHEDULE) {
            subject = "SUCCESS! PAX RIDE CONFIRMATION";
            emailTemplate = './templates/Ride-accepted-scheduled.html';
        } else if (emailRequest.template === CONSTANTS.RIDES.CANCELLEDBYDRIVER) {
            subject = "ALERT! Ride Cancelled!";
            emailTemplate = './templates/Ride-cancelled-by-driver.html';
        } else if (emailRequest.template === CONSTANTS.RIDES.SCHEDULERIDE) {
            subject = "REMINDER!";
            emailTemplate = './templates/Ride-accepted-scheduled-15and30Min.html';
        } else if (emailRequest.template === CONSTANTS.RIDES.DRIVERCHANGED_DRIVER) {
            subject = "Schedule Ride!";
            emailTemplate = './templates/Ride-driver-changed-driver.html';
        } else if (emailRequest.template === CONSTANTS.RIDES.DRIVERCHANGED_RIDER) {
            subject = "Schedule Ride!";
            emailTemplate = './templates/Ride-driver-changed-rider.html';
        } else if (emailRequest.template === CONSTANTS.ADMIN.RESCHEDULEDNOTACCEPTED) {
            subject = 'Rescheduled Ride Not Accepted!';
            emailTemplate = './templates/Ride-Not-accepted-ReScheduledRide.html';
        } else if (emailRequest.template === CONSTANTS.RIDERS.NOTACCEPTEDSCHEDULERIDE) {
            subject = 'Scheduled Ride Not Accepted!';
            emailTemplate = './templates/Ride-Not-accepted-ScheduledRide.html';
        } else if (emailRequest.template === CONSTANTS.RIDES.RIDESCHEDULED60MINUTES) { //Send an email to driver before 60 minutes of scheduled ride
            subject = 'Scheduled Ride Reminder!';
            emailTemplate = './templates/Schedule-ride-reminder-60min.html';
        } else if (emailRequest.template === CONSTANTS.RIDES.DRIVERCHANGED_NOW_RIDER) {
            subject = "Ride!";
            emailTemplate = './templates/RideNow-driver-changed-rider.html';
        } else if (emailRequest.template === CONSTANTS.RIDES.DRIVERCHANGED_NOW_DRIVER) {
            subject = "Ride!";
            emailTemplate = './templates/RideNow-driver-changed-driver.html';
        } else if (emailRequest.template === CONSTANTS.RIDES.DRIVERSCHEDULE_30_MINUTES_BEFORE) {//send an email to driver before 30 minutes of scheduled ride
            subject = 'Scheduled Ride Reminder!';
            emailTemplate = './templates/Schedule-ride-reminder-30min-driver.html';
        } else if (emailRequest.template === CONSTANTS.RIDES.RIDE_UPDATE_ADMIN) {
            subject = "Scheduled Ride Reminder!";
            emailTemplate = './templates/Ride-update-admin.html';
        } else if (emailRequest.template === CONSTANTS.RIDERS.RECEIPT) {
            subject = "Ride Receipt!";
            emailTemplate = './templates/Ride-receipt.html';
        }


        if (emailTemplate) {
            const result = await readFile(emailTemplate);
            mailMessage = result.replace(/{email}/g, emailRequest?.email);
            mailMessage = mailMessage.replace(/{password}/g, emailRequest?.password);
            mailMessage = mailMessage.replace(/{firstName}/g, emailRequest?.firstName);
            mailMessage = mailMessage.replace(/{otp}/g, emailRequest?.otp);
            mailMessage = mailMessage.replace(/{lastName}/g, emailRequest?.lastName);
            mailMessage = mailMessage.replace(/{phoneNumber}/g, emailRequest?.phoneNumber);
            mailMessage = mailMessage.replace(/{RiderName}/g, emailRequest?.riderName);
            mailMessage = mailMessage.replace(/{DriverName}/g, emailRequest?.driverName);
            mailMessage = mailMessage.replace(/{pickupAddress}/g, emailRequest?.pickupAddress);
            mailMessage = mailMessage.replace(/{dropOffAddress}/g, emailRequest?.dropOffAddress);
            mailMessage = mailMessage.replace(/{fare}/g, emailRequest?.fare);
            mailMessage = mailMessage.replace(/{insurance}/g, emailRequest?.insurance);
            mailMessage = mailMessage.replace(/{reservedDateTime}/g, emailRequest?.reservedDateTime);
            mailMessage = mailMessage.replace(/{minutes}/g, emailRequest?.arrivedTimeText);
            mailMessage = mailMessage.replace(/{timeRemaining}/g, emailRequest?.timeRemaining);
            mailMessage = mailMessage.replace(/{message}/g, emailRequest?.message);
            mailMessage = mailMessage.replace(/{tip}/g, emailRequest?.tip);
            mailMessage = mailMessage.replace(/{TNSCharge}/g, emailRequest?.TNSCharge);

            var mailOptions = {
                from: process.env.EMAIL_SMTP,
                to: emailRequest.to,
                subject: subject,
                html: mailMessage
            };
            sendMail(mailOptions);

            async function readFile(file) {
                try {
                    const data = await fs.readFile(file, 'utf8');
                    return data;
                } catch (error) {
                    logger.error(error);
                };
            };
        } else {
            var mailOptions = {
                from: process.env.EMAIL_SMTP,
                ...(emailRequest.to ? { to: emailRequest?.to } : { bcc: emailRequest?.bcc }),
                // bcc: emailRequest.to,
                subject: subject,
                html: mailMessage
            };
            sendMail(mailOptions);
        };
    }
};