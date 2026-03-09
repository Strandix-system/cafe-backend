import crypto from "crypto";
import IssueReported from "../../model/issueReported.js";

const generateTicketId = () => {
    const randomPart = crypto.randomBytes(4).toString("hex").toUpperCase();
    return `TKT-${Date.now()}-${randomPart}`;
};

const issueService = {
    raiseTicket: async (data, adminId, files = []) => {
        const images = (Array.isArray(files) ? files : [])
            .map((file) => file?.location)
            .slice(0, 3);

        const ticket = await IssueReported.create({
            title: data.title,
            description: data.description,
            images,
            adminId,
            ticketId: generateTicketId(),
            status: "pending",
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
            const error = new Error("Ticket not found");
            error.statusCode = 404;
            throw error;
        }

        return ticket;
    },
};

export default issueService;
