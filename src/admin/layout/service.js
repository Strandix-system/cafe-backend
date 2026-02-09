import CafeLayout from "../../../model/layout.js";
import { deleteUploadedFiles } from "../../../utils/s3utils.js";
import mongoose from "mongoose";
const layoutService = {
  // ✅ CREATE
 createCafeLayout: async (adminId, body, files, role) => {
  // ❌ Prevent duplicate layout
  // const existing = await CafeLayout.findOne({ adminId });
  // if (existing) {
  //   const err = new Error("Layout already exists for this admin");
  //   err.statusCode = 400;
  //   throw err;
  // }

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
    hours,
    socialLinks,
  } = body;

  let defaultLayoutId = null;
  let defaultLayout = false;

  // 🟢 ADMIN FLOW → auto assign default layout
  if (role === "admin") {
    const baseLayout = await CafeLayout.findOne({ defaultLayout: true });

    if (!baseLayout) {
      const err = new Error("No default layout available");
      err.statusCode = 500;
      throw err;
    }

    defaultLayoutId = baseLayout._id;
    defaultLayout = false;
  }

  // 🔵 SUPERADMIN FLOW
  if (role === "superadmin") {
    defaultLayout = true;
  }

  const layout = await CafeLayout.create({
    adminId,
    homeImage: files.homeImage[0].location,
    aboutImage: files.aboutImage[0].location,
    menuTitle,
    layoutTitle,
    aboutTitle,
    aboutDescription,
    cafeDescription,
    hours,
    socialLinks,
    defaultLayout,
    defaultLayoutId,
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

    // Images update
    if (files?.homeImage) {
      layout.homeImage = files.homeImage[0].location;
    }
    if (files?.aboutImage) {
      layout.aboutImage = files.aboutImage[0].location;
    }

    // 🆕 Nested object safe update
    if (body.hours) {
      layout.hours = {
        ...layout.hours,
        ...body.hours,
      };
    }

    if (body.socialLinks) {
      layout.socialLinks = {
        ...layout.socialLinks,
        ...body.socialLinks,
      };
    }

    // Other simple fields
    Object.assign(layout, body);

    await layout.save();
    return layout;
  },

  // ✅ GET ALL (WITH ADMIN DATA)
  getAllCafeLayouts: async (filter, options) => {
    const result = await CafeLayout.paginate(filter, options);
    return result;
  },
  getAllLayout: async (filter, options) => {
    const result = await CafeLayout.find(filter,options);
    return result;
  },
  // // ✅ GET (ADMIN WISE)
  // getCafeLayout: async (adminId) => {
  //   const result = await CafeLayout.findOne({ adminId })
  //     .populate("adminId", "logo address phone email");

  //   return result;
  // },
  getLayoutById: async (id) => {
    const layout = await CafeLayout.findById(id);
    return layout;
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
  getDefaultLayout: async (id) => {
    const result = await CafeLayout.findById(id)
      .populate("adminId", "logo address phoneNumber email cafeName");
    return result;
  },
  // // 🔐 GENERATE PREVIEW TOKEN FOR DEFAULT LAYOUT
  // generatePreviewTokenForDefault: async () => {
  //   const layout = await CafeLayout.findOne({ defaultLayout: true });

  //   if (!layout) {
  //     const err = new Error("Default layout not found");
  //     err.statusCode = 404;
  //     throw err;
  //   }
  //   // generate token
  //   const token = new mongoose.Types.ObjectId().toString();

  //   layout.previewToken = token;
  //   await layout.save();
  //   return {
  //     previewToken: token,
  //     layoutId: layout._id,
  //   };
  // },
  // 🌐 GET LAYOUT BY PREVIEW TOKEN
  // getLayoutByPreviewToken: async (token) => {
  //   const layout = await CafeLayout.findOne({ previewToken: token })
  //   if (!layout) {
  //     const err = new Error("Invalid or expired preview token");
  //     err.statusCode = 404;
  //     throw err;
  //   }
  //   return layout;
  // },
};
export default layoutService;