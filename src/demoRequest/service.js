import DemoRequest from "../../model/demoRequest.js";

const demoService = {
    createDemoRequest: async (body) => {
        const result = await DemoRequest.create(body);
        return result;
    },

    updateDemoStatus: async (id, status) => {
        const result = await DemoRequest.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );
        return result;
    },

    getAllDemoRequests: async (filter, options) => {
        const result = await DemoRequest.paginate(filter, options);
        return result;
    },
}
export default demoService;