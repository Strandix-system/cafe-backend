import CafeLayout from "../../../model/layout.js";
import { deleteUploadedFiles } from "../../../utils/s3Utils.js";


const layoutService = {
  createCafeLayout: async (adminId, body, files, role) => {
    const homeImage = files?.homeImage?.[0]?.location;
    const aboutImage = files?.aboutImage?.[0]?.location;
    if (!homeImage || !aboutImage) {
      throw Object.assign(new Error("Both Home image and About image are required"), {
        statusCode: 400
      });
    }
    let defaultLayoutId = null;
    let defaultLayout = role === "superadmin";
    if (role === "admin") {
      const baseLayout = await CafeLayout.findOne({ defaultLayout: true });
      if (!baseLayout) throw Object.assign(new Error("No default layout available"), { statusCode: 500 });
      defaultLayoutId = baseLayout._id;
    }
    const layout = await CafeLayout.create({
      ...body,
      adminId,
      homeImage, // S3 URL
      aboutImage, // S3 URL
      defaultLayout,
      defaultLayoutId,
    });
    return layout;
  },
 updateCafeLayout: async (id, body, files) => {
  const layout = await CafeLayout.findById(id);
  if (!layout) {
    throw Object.assign(new Error("Cafe layout not found"), { statusCode: 404 });
  }
  if (files?.homeImage?.[0]?.location) {
    if (layout.homeImage) {
      await deleteSingleFile(layout.homeImage).catch(err => console.error("S3 Error:", err));
    }
    layout.homeImage = files.homeImage[0].location;
  }
  if (files?.aboutImage?.[0]?.location) {
    if (layout.aboutImage) {
      await deleteSingleFile(layout.aboutImage).catch(err => console.error("S3 Error:", err));
    }
    layout.aboutImage = files.aboutImage[0].location;
  }
  ['hours', 'socialLinks'].forEach(field => {
    if (body[field]) {
      const parsedData = typeof body[field] === 'string' ? JSON.parse(body[field]) : body[field];
      layout[field] = {
        ...(layout[field]?.toObject?.() || layout[field] || {}),
        ...parsedData,
      };
      delete body[field]; 
    }
  });
  Object.assign(layout, body);
  await layout.save();

  return layout;
},
  deleteCafeLayout: async (id) => {
    const layout = await CafeLayout.findById(id);
    if (!layout) {
      throw Object.assign(new Error("Cafe layout not found"), { statusCode: 404 });
    }
    const imagesToDelete = [];
    if (layout.homeImage) imagesToDelete.push(layout.homeImage);
    if (layout.aboutImage) imagesToDelete.push(layout.aboutImage);
    if (imagesToDelete.length > 0) {
      try {
        await deleteUploadedFiles(imagesToDelete);
        console.log("✅ S3 images deleted successfully");
      } catch (err) {
        console.error("Failed to delete S3 images during layout deletion:", err.message);
      }
    }
    const result = await layout.deleteOne();
    return result;
  },
  getCafeLayoutByAdmin: async (filter, options) => {
    const result = await CafeLayout.paginate(filter, options);
    return result;
  },
  getAllLayout: async (filter, options) => {
    const result = await CafeLayout.paginate(filter, options);
    return result;
  },
  getLayoutById: async (id) => {
    const layout = await CafeLayout.findById(id);
    return layout;
  },
  getDefaultLayout: async (id) => {
    const result = await CafeLayout.findById(id)
      .populate("adminId", "logo address phoneNumber email cafeName gst ").populate("menus");
    return result;
  },
};
export default layoutService;