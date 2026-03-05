import express from "express";
import issueController from "../src/issueReported/controller.js";
import { tokenVerification } from "../middleware/auth.js";
import { allowRoles } from "../middleware/permission.js";
import { uploadQueryImage } from "../middleware/upload.js";

const router = express.Router();

router.post(
    "/raise",
    tokenVerification,
    allowRoles("admin"),
    uploadQueryImage.array("images", 3),
    issueController.raiseTicket
);
router.get(
    "/get-tickets",
    tokenVerification,
    allowRoles("admin", "superadmin"),
    issueController.getTickets
);
router.patch(
    "/status/:ticketId",
    tokenVerification,
    allowRoles("superadmin"),
    issueController.updateStatus
);

export default router;
