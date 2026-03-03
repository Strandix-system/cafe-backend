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
    "/get-my",
    tokenVerification,
    allowRoles("admin"),
    issueController.getAdminTickets
);
router.get(
    "/all",
    tokenVerification,
    allowRoles("superadmin"),
    issueController.getAllTickets
);
router.patch(
    "/status/:ticketId",
    tokenVerification,
    allowRoles("superadmin"),
    issueController.updateStatus
);

export default router;
