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
            admin: adminId,
            ticketId: generateTicketId(),
            status: "pending",
        });

        return ticket;
    },
    getTickets: async (user, filter, options) => {
        if (user.role === "admin") {
            filter.admin = user._id;
        } else if (user.role === "superadmin") {
            if (filter.adminId) {
                filter.admin = filter.adminId;
            }
        } else {
            const error = new Error("Access denied");
            error.statusCode = 403;
            throw error;
        }

        if (filter.search) {
            filter.$or = [
                { title: { $regex: filter.search, $options: "i" } },
                { description: { $regex: filter.search, $options: "i" } },
                { ticketId: { $regex: filter.search, $options: "i" } },
            ];
            delete filter.search;
        }
        delete filter.adminId;

        const paginateOptions = {
            ...options,
            sortBy: options.sortBy || "createdAt:desc",
        };

        if (user.role === "superadmin") {
            paginateOptions.populate = options.populate || "admin";
        }

        return IssueReported.paginate(filter, paginateOptions);
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
