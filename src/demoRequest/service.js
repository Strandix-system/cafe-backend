import DemoRequest from "../../model/demoRequest.js";
import { ApiError } from "../../utils/apiError.js";

const demoService = {
    createDemoRequest: async (body) => {
        const result = await DemoRequest.create(body);
        return result;
    },

    updateDemoStatus: async (id, status) => {
        const allowedStatus = ["requested", "full_filled", "inquiry","not_interested"];

        if (!allowedStatus.includes(status)) {
            throw new ApiError(400, "Invalid status value");
        }

        const result = await DemoRequest.findByIdAndUpdate(
            id,
            { status },
            { new: true, runValidators: true }
        );

        if (!result) {
            throw new ApiError(404, "Demo request not found");
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
            throw new ApiError(404, "DemoUser not found");
        }
        return demoUser;
    },
}
export default demoService;
