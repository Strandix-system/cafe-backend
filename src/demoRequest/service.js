import DemoRequest from "../../model/demoRequest.js";

const demoService = {
    createDemoRequest: async (body) => {
        const result = await DemoRequest.create(body);
        return result;
    },

    updateDemoStatus: async (id, status) => {
        if (!["accepted", "rejected"].includes(status)) {
            throw Object.assign(new Error("Invalid status value"), { statusCode: 404 });
        }
        const result = await DemoRequest.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );

        if (!result) {
            throw Object.assign(new Error("Demo request not find"), { statusCode: 404 });
        }
        return result;
    },

    getAllDemoRequests: async (filter, options) => {
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