import express from "express";
import issueController from "../src/issueReported/controller.js";
import { tokenVerification } from "../middleware/auth.js";
import { allowRoles } from "../middleware/permission.js";
import { uploadQueryImage } from "../middleware/upload.js";
import { validate } from "../middleware/validate.js";
import {
    raiseIssueValidator,
    getIssueTicketsValidator,
    updateIssueStatusValidator,
} from "../validations/issueReportedValidation.js";

const router = express.Router();

router.post(
    "/raise",
    tokenVerification,
    allowRoles("admin"),
    uploadQueryImage.array("images", 3),
    validate(raiseIssueValidator),
    issueController.raiseTicket
);
router.get(
    "/get-tickets",
    tokenVerification,
    allowRoles("admin", "superadmin"),
    validate(getIssueTicketsValidator),
    issueController.getTickets
);
router.patch(
    "/status/:ticketId",
    tokenVerification,
    allowRoles("superadmin"),
    validate(updateIssueStatusValidator),
    issueController.updateStatus
);

export default router;
