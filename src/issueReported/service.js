import crypto from "crypto";
import IssueReported from "../../model/issueReported.js";

const ALLOWED_STATUS = ["pending", "in_progress", "resolve"];

const generateTicketId = () => {
    const randomPart = crypto.randomBytes(4).toString("hex").toUpperCase();
    return `TKT-${Date.now()}-${randomPart}`;
};

const issueService = {
    raiseTicket: async (data, adminId, files = []) => {
        const title = data?.title?.trim();
        const description = data?.description?.trim();

        if (!title || !description) {
            const error = new Error("title and description are required");
            error.statusCode = 400;
            throw error;
        }

        const images = (Array.isArray(files) ? files : [])
            .map((file) => file?.location)
            .filter(Boolean)
            .slice(0, 3);

        const ticket = await IssueReported.create({
            title,
            description,
            images,
            admin: adminId,
            ticketId: generateTicketId(),
            status: "pending",
        });

        return ticket;
    },
    getAllTickets: async (filter, options) => {
        const query = {};

        if (filter.status) {
            query.status = filter.status;
        }
        if (filter.ticketId) {
            query.ticketId = filter.ticketId;
        }
        if (filter.adminId) {
            query.admin = filter.adminId;
        }
        if (filter.search) {
            query.$or = [
                { title: { $regex: filter.search, $options: "i" } },
                { description: { $regex: filter.search, $options: "i" } },
                { ticketId: { $regex: filter.search, $options: "i" } },
            ];
        }

        return IssueReported.paginate(query, {
            ...options,
            populate: options.populate || "admin",
            sortBy: options.sortBy || "createdAt:desc",
        });
    },
    updateStatus: async (ticketId, status) => {
        if (!ticketId) {
            const error = new Error("ticketId is required");
            error.statusCode = 400;
            throw error;
        }

        if (!ALLOWED_STATUS.includes(status)) {
            const error = new Error("Invalid status. Allowed: pending, in_progress, resolve");
            error.statusCode = 400;
            throw error;
        }

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
    getAdminTickets: async (adminId, filter, options) => {
        const query = { admin: adminId };

        if (filter.status) {
            query.status = filter.status;
        }
        if (filter.ticketId) {
            query.ticketId = filter.ticketId;
        }
        if (filter.search) {
            query.$or = [
                { title: { $regex: filter.search, $options: "i" } },
                { description: { $regex: filter.search, $options: "i" } },
                { ticketId: { $regex: filter.search, $options: "i" } },
            ];
        }

        return IssueReported.paginate(query, {
            ...options,
            sortBy: options.sortBy || "createdAt:desc",
        });
    },
};

export default issueService;
