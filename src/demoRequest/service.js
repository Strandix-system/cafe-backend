import DemoRequest from "../../model/demoRequest.js";
import { notificationService } from "../notification/notification.service.js";
import { NOTIFICATION_TYPES } from "../../utils/constants.js";

const demoService = {
    createDemoRequest: async (body) => {
        const result = await DemoRequest.create(body);

        await notificationService.createNotification({
            title: "New demo request",
            message: `${result.name} requested a demo for ${result.cafeName} in ${result.city}.`,
            notificationType: NOTIFICATION_TYPES.DEMO_REQUEST_CREATED,
            recipientType: "role",
            recipientRole: "superadmin",
            entityType: "demo_request",
            entityId: result._id,
        });

        return result;
    },

    updateDemoStatus: async (id, status) => {
        const allowedStatus = ["requested", "full_filled", "inquiry","not_interested"];

        if (!allowedStatus.includes(status)) {
            throw Object.assign(new Error("Invalid status value"), { statusCode: 400 });
        }

        const result = await DemoRequest.findByIdAndUpdate(
            id,
            { status },
            { new: true, runValidators: true }
        );

        if (!result) {
            throw Object.assign(new Error("Demo request not found"), { statusCode: 404 });
        }

        return result;
    },

    getAllDemoRequests: async (filter, options) => {
        if (filter.status) {
            filter.status = filter.status;
        }
        if (filter.search) {

            filter.$or = [
                { name: { $regex: filter.search, $options: "i" } },
                { status: { $regex: filter.search, $options: "i" } }
            ];
            delete filter.search;
        }
        
        const result = await DemoRequest.paginate(filter, options);
        return result;
    },
    getDemoRequestById: async (demoId) => {
        const demoUser = await DemoRequest.findById(demoId);
        if (!demoUser) {
            throw Object.assign(new Error("DemoUser not found"), { statusCode: 404 });
        }
        return demoUser;
    },
}
export default demoService;
