import DemoRequest from "../../model/demoRequest.js";

const demoService = {
    createDemoRequest: async (body) => {
        const result = await DemoRequest.create(body);
        return result;
    },

    updateDemoStatus: async (id, status) => {
        const allowedStatus = ["Requested", "Full Filled", "Inquiry", "Not Interested"];

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