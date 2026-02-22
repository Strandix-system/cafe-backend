import demoService from "./service.js";
import {pick} from "../../utils/pick.js"
import { sendSuccessResponse } from "../../utils/response.js";

const demoController = {

 createDemoRequest : async (req, res) => {
  try {
    const result = await demoService.createDemoRequest(req.body);

    res.status(201).json({
      success: true,
      message: "Demo request submitted successfully",
      result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
},


 updateDemoStatus : async (req, res) => {
  try {
    const { status } = req.body;

    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    const result = await demoService.updateDemoStatus(
      req.params.id,
      status
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Demo request not found",
      });
    }

    res.json({
      success: true,
      message: `Demo request ${status} successfully`,
      result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
},

 getAllDemoRequests : async (req, res, next ) => {
  try {
      const filter = pick(req.query, ["search"]);
      const options = pick(req.query, ["page", "limit", "sortBy", "populate"]);
      const result = await demoService.getAllDemoRequests(filter, options);
      sendSuccessResponse(res, 200, "requests fetched successfully", result);
    } catch (error) {
      next(error);
    }
  },
}
export default demoController;