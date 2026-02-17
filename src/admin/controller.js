import service from "./service.js";
import { sendSuccessResponse } from "../../utils/response.js";
import { pick } from "../../utils/pick.js"

export default {
  createAdmin: async (req, res, next) => {
    try {
      const result = await service.createAdmin(req.body, req.files);
      sendSuccessResponse(res, 201, "Admin created successfully", result);
    } catch (err) {
      next(err);
    }
  },
  updateAdmin: async (req, res, next) => {
    try {
      const result = await service.updateAdmin(req.params.id, req.body, req.files);
      sendSuccessResponse(res, 200, "Admin updated successfully", result);
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
      const filter = pick(req.query, ["search", "isActive"]);
      const options = pick(req.query, ['page', 'limit', 'sortBy', 'populate']);
      if (filter.isActive !== undefined) {
        filter.isActive = filter.isActive === "true";
      }
      const result = await service.listAdmins(filter, options, req.query);
      sendSuccessResponse(res, 200, "Admins fetched successfully", result);
    } catch (error) {
      next(error);
    }
  },
  getByAdmin: async (req, res, next) => {
    try {
      const admins = await service.getByAdmin(req.params.id);
      sendSuccessResponse(res, 200, "Admins fetched successfully", admins);
    } catch (error) {
      next(error);
    }
  },
  updateAdminStatus: async (req, res, next) => {
    try {
      const adminId = req.params.id;
      const { isActive } = req.body;

      if (typeof isActive !== "boolean") {
        return next(Object.assign(new Error("isActive must be boolean"), { statusCode: 400 }));
      }

      const result = await service.updateAdminStatus(adminId, isActive);
      sendSuccessResponse(res, 200, "Admin status updated successfully", result);
    } catch (error) {
      next(error);
    }
  },
};

