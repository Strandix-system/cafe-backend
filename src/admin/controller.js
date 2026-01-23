import service from "./service.js";
import { sendSuccessResponse } from "../../utils/response.js";

export default {
  createAdmin: async (req, res, next) => {
    try {
      const admin = await service.createAdmin(req.body);
      sendSuccessResponse(res, 201, "Admin created", admin);
    } catch (error) {
      next(error);
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
      const result = await service.listAdmins(req.query);
      sendSuccessResponse(res, 200, "Admins fetched successfully", result);
    } catch (error) {
      next(error);
    }
  },
};

