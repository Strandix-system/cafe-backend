import CafeLayout from "../../../model/layout.js";
import { deleteUploadedFiles } from "../../../utils/s3utils.js";

const layoutService = {
  // Superadmin creates template
  // ✅ CREATE
  createCafeLayout: async (adminId, body, files) => {
    const existing = await CafeLayout.findOne({ adminId });
    if (existing) {
      const err = new Error("Layout already exists for this admin");
      err.statusCode = 400;
      throw err;
    }
    if (!files?.homeImage || !files?.aboutImage) {
      const err = new Error("Home image and About image are required");
      err.statusCode = 400;
      throw err;
    }

    const {
      menuTitle,
      layoutTitle,
      aboutTitle,
      aboutDescription,
      cafeDescription,
      defaultLayout,
    } = body;

    const layout = await CafeLayout.create({
      adminId,
      homeImage: files.homeImage[0].location,
      aboutImage: files.aboutImage[0].location,
      menuTitle,
      layoutTitle,
      aboutTitle,
      aboutDescription,
      cafeDescription,
      defaultLayout: defaultLayout || false,
    });
    if (!layout) {
      await deleteUploadedFiles([
        files.homeImage[0].location,
        files.aboutImage[0].location,
      ]);
      throw new Error("Failed to create cafe layout");
    }
    return layout;
  },

  // ✅ UPDATE
  updateCafeLayout: async (id, body, files) => {
    const layout = await CafeLayout.findById(id);
    if (!layout) {
      const err = new Error("Cafe layout not found");
      err.statusCode = 404;
      throw err;
    }

    if (files?.homeImage) {
      layout.homeImage = files.homeImage[0].location;
    }
    if (files?.aboutImage) {
      layout.aboutImage = files.aboutImage[0].location;
    }

    Object.assign(layout, body);

    await layout.save();
    return layout;
  },

  // ✅ GET (ADMIN WISE)
  getCafeLayout: async (adminId) => {
    return await CafeLayout.findOne({ adminId });
  },

  // ✅ DELETE
  deleteCafeLayout: async (id) => {
    const deleted = await CafeLayout.findByIdAndDelete(id);
    if (!deleted) {
      const err = new Error("Cafe layout not found");
      err.statusCode = 404;
      throw err;
    }
    return true;
  },
  // ✅ GET DEFAULT LAYOUT (SUPER ADMIN CREATED)
  getDefaultLayout: async () => {
const result=await CafeLayout.findOne({ defaultLayout: true });
  return result;
},

};
export default layoutService;
