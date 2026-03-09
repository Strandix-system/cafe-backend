import issueService from "./service.js";
import { sendSuccessResponse } from "../../utils/response.js";
import { pick } from "../../utils/pick.js";

const issueController = {
    raiseTicket: async (req, res, next) => {
        try {
            const data = await issueService.raiseTicket(req.body, req.user._id, req.files);
            sendSuccessResponse(res, 201, "Ticket raised successfully", data);
        } catch (err) {
            next(err);
        }
    },
    getTickets: async (req, res, next) => {
        try {
            const filter = pick(req.query, ["search", "status", "ticketId", "adminId"]);
            const options = pick(req.query, ["page", "limit", "sortBy", "populate"]);
            if (req.user.role === "admin") {
                filter.adminId = req.user._id;
            }
            const data = await issueService.getTickets(filter, options);
            sendSuccessResponse(res, 200, "Tickets fetched", data);
        } catch (err) {
            next(err);
        }
    },
    updateStatus: async (req, res, next) => {
        try {
            const { ticketId } = req.params;
            const { status } = req.body;

            const data = await issueService.updateStatus(ticketId, status);
            sendSuccessResponse(res, 200, "Status updated", data);
        } catch (err) {
            next(err);
        }
    },
};

export default issueController;
