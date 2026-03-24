import service from "./service.js";
import { sendSuccessResponse } from "../../utils/response.js";
import { pick } from "../../utils/pick.js";
import { ApiError } from "../../utils/apiError.js";

export default {
  createAdmin: async (req, res) => {
    const result = await service.createAdmin(req.body, req.files);
    sendSuccessResponse(res, 201, "Admin created successfully", result);
  },
  updateAdmin: async (req, res) => {
    const result = await service.updateAdmin(req.params.id, req.body, req.files);
    sendSuccessResponse(res, 200, "Admin updated successfully", result);
  },
  deleteAdmin: async (req, res) => {
    await service.deleteAdmin(req.params.id);
    sendSuccessResponse(res, 200, "Admin deleted successfully", null);
  },
  listAdmins: async (req, res) => {
    const filter = pick(req.query, ["search", "isActive"]);
    const options = pick(req.query, ["page", "limit", "sortBy", "populate"]);
    if (filter.isActive !== undefined) {
      filter.isActive = filter.isActive === "true";
    }
    const result = await service.listAdmins(filter, options, req.query);
    sendSuccessResponse(res, 200, "Admins fetched successfully", result);
  },
  getByAdmin: async (req, res) => {
    const admins = await service.getByAdmin(req.params.id);
    sendSuccessResponse(res, 200, "Admins fetched successfully", admins);
  },
  updateAdminStatus: async (req, res) => {
    const adminId = req.params.id;
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      throw new ApiError(400, "isActive must be boolean");
    }

    const result = await service.updateAdminStatus(adminId, isActive);
    sendSuccessResponse(res, 200, "Admin status updated successfully", result);
  },
  updateSuperAdmin: async (req, res) => {
    const result = await service.updateSuperAdmin(req.params.id, req.body, req.files);
    sendSuccessResponse(res, 200, "SuperAdmin updated successfully", result);
  },
};
