import service from "./service.js";
import { sendSuccessResponse } from "../../utils/response.js";
import {pick} from "../../utils/pick.js"

export default {
createAdmin: async (req, res, next) => {
  try {
    const result = await service.createAdmin(req.body, req.files);
    res.status(201).json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
  },
  updateAdmin: async (req, res, next) => {
    try {
      const admin = await service.updateAdmin(req.params.id, req.body);
      sendSuccessResponse(res, 200, "Admin updated successfully", admin);
    } catch (error) {
      next(error);
    }
  },
  deleteAdmin: async (req, res, next) => {
    try {
      await service.deleteAdmin(req.params.id);
      sendSuccessResponse(res, 200, "Admin deleted successfully", null);
    } catch (error) {
      next(error);
    }
  },
  listAdmins: async (req, res, next) => {
    try {
      const filter = pick(req.query,["search"]);
      const options = pick(req.query, ['page', 'limit', 'sortBy', 'populate']);
      const result = await service.listAdmins(filter,options,req.query);
      sendSuccessResponse(res, 200, "Admins fetched successfully", result);
    } catch (error) {
      next(error);
    }
  },
};

