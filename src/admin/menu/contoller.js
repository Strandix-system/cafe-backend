import menuService from "./service.js";
import { sendSuccessResponse } from "../../../utils/response.js";
import { pick } from "../../../utils/pick.js"

const menuController = {
  // ✅ CREATE MENU
  createMenu: async (req, res, next) => {
    try {
      const result = await menuService.createMenu(

        req.user._id,
        req.body,
        req.file // 
      );

      sendSuccessResponse(res, 201, "Menu created successfully", result);
    } catch (error) {
      next(error);
    }
  },

  // ✅ UPDATE MENU
  updateMenu: async (req, res, next) => {
    try {
      const result = await menuService.updateMenu(
        req.params.id,
        req.body, req.file
      );
      sendSuccessResponse(res, 200, "Menu updated successfully", result);
    } catch (error) {
      next(error);
    }
  },
  // ✅ DELETE MENU (HARD DELETE)
  deleteMenu: async (req, res, next) => {
    try {
      await menuService.deleteMenu(req.params.id);
      sendSuccessResponse(res, 200, "Menu deleted successfully");
    } catch (error) {
      next(error);
    }
  },
  // ✅ GET ALL MENUS (ADMIN WISE)
  getAllMenus: async (req, res, next) => {
    try {
      const filter = pick(req.query, ["adminId", "search", "category"]);
      const options = pick(req.query, ["page", "limit", "sortBy", "populate"]);
      const result = await menuService.getAllMenus(filter, options, req.user._id);
      sendSuccessResponse(res, 200, "menu fetched successfully", result);
    } catch (error) {
      next(error);
    }
  },
  getMenusByAdmin: async (req, res, next) => {
    try {
      const adminId = req.user.id;
      const options = pick(req.query, ["page", "limit", "sortBy", "populate"]);
      const filter = pick(req.query, ["adminId", "search", "category"]);
      const result = await menuService.getMenusByAdmin(adminId, filter, options);
      sendSuccessResponse(res, 200, "Admin menus fetched successfully", result);
    } catch (error) {
      next(error);
    }
  },


  // 🌍 GET PUBLIC MENUS (Portfolio)
  getPublicMenus: async (req, res, next) => {
    try {
      const { adminId } = req.params;

      const result = await menuService.getPublicMenus(
        adminId,
        req.query
      );

      sendSuccessResponse(res, 200, "Public menu fetched successfully", result);
    } catch (error) {
      next(error);
    }
  },
};

export default menuController;
