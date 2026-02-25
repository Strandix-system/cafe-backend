import demoService from "./service.js";
import { pick } from "../../utils/pick.js"
import { sendSuccessResponse } from "../../utils/response.js";

const demoController = {

  createDemoRequest: async (req, res, next) => {
    try {
      const result = await demoService.createDemoRequest(req.body);
      sendSuccessResponse(res, 201, "Requested created successfully", result);
    } catch (error) {
      next(error)
    }
  },


  updateDemoStatus: async (req, res, next) => {
    try {
      const { status } = req.body;
      const result = await demoService.updateDemoStatus(
        req.params.id,
        status
      );
      sendSuccessResponse(res, 201, "Requested updated successfully", result);
    } catch (error) {
      next(error)
    }
  },

  getAllDemoRequests: async (req, res, next) => {
    try {
      const filter = pick(req.query, ["search"]);
      const options = pick(req.query, ["page", "limit", "sortBy", "populate"]);
      const result = await demoService.getAllDemoRequests(filter, options);
      sendSuccessResponse(res, 200, "requests fetched successfully", result);
    } catch (error) {
      next(error);
    }
  },

  getDemoRequestById: async (req, res, next) => {
    try { const demoId=req.params.id
      const result = await demoService.getDemoRequestById(demoId);
      sendSuccessResponse(res, 200, "Demo requests fetched successfully", result);
    } catch (error) {
      next(error)
    }
  },
}
export default demoController;