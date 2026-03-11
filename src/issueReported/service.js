import { IssueReported } from "../../model/issueReported.js";
import { generateTicketId } from "../../utils/utils.js";
import { ApiError } from "../../utils/apiError.js";
import { ISSUE_STATUSES } from "../../utils/constants.js";

export const issueService = {
    raiseTicket: async (data, adminId, files = []) => {
        const images = (Array.isArray(files) ? files : [])
            .map((file) => file?.location)
            .slice(0, 3);

        const ticket = await IssueReported.create({
            ...data,
            images,
            adminId,
            ticketId: generateTicketId(),
            status: ISSUE_STATUSES.PENDING,
        });

        return ticket;
    },
    getTickets: async (filter, options) => {
        if (filter.search) {
            filter.$or = [
                { title: { $regex: filter.search, $options: "i" } },
                { description: { $regex: filter.search, $options: "i" } },
                { ticketId: { $regex: filter.search, $options: "i" } },
            ];
            delete filter.search;
        }

        return await IssueReported.paginate(filter, options);
    },
    updateStatus: async (ticketId, status) => {
        const ticket = await IssueReported.findOneAndUpdate(
            { ticketId },
            { status },
            { new: true }
        );

        if (!ticket) {
            throw new ApiError(404, "Ticket not found");
        }

        return ticket;
    },
};
