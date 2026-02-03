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
        req.body
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
      const filter = pick(req.query, ["search"]);
      const options = pick(req.query, ['page', 'limit', 'sortBy', 'populate']);
      const result = await menuService.getAllMenus(filter, options, req.query);
      sendSuccessResponse(res, 200, "menu fetched successfully", result);
    } catch (error) {
      next(error);
    }
  },
};

export default menuController;
