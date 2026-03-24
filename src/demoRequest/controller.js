import demoService from "./service.js";
import { pick } from "../../utils/pick.js";
import { sendSuccessResponse } from "../../utils/response.js";

const demoController = {
  createDemoRequest: async (req, res) => {
    const result = await demoService.createDemoRequest(req.body);
    sendSuccessResponse(res, 201, "Requested created successfully", result);
  },
  updateDemoStatus: async (req, res) => {
    const { status } = req.body;
    const result = await demoService.updateDemoStatus(
      req.params.id,
      status
    );
    sendSuccessResponse(res, 201, "Requested updated successfully", result);
  },
  getAllDemoRequests: async (req, res) => {
    const filter = pick(req.query, ["search", "status"]);
    const options = pick(req.query, ["page", "limit", "sortBy", "populate"]);
    const result = await demoService.getAllDemoRequests(filter, options);
    sendSuccessResponse(res, 200, "requests fetched successfully", result);
  },
  getDemoRequestById: async (req, res) => {
    const demoId = req.params.id;
    const result = await demoService.getDemoRequestById(demoId);
    sendSuccessResponse(res, 200, "Demo requests fetched successfully", result);
  },
};

export default demoController;
