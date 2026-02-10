import CafeLayout from "../../../model/layout.js";
import { deleteUploadedFiles } from "../../../utils/s3utils.js";
import mongoose from "mongoose";

const layoutService = {
  createCafeLayout: async (adminId, body, files, role) => {
    if (!files?.homeImage?.[0] || !files?.aboutImage?.[0]) {
      throw Object.assign(new Error("Home image and About image are required"), { statusCode: 400 });
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
      homeImage: files.homeImage[0].location,
      aboutImage: files.aboutImage[0].location,
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
    const imageFields = ['homeImage', 'aboutImage'];
    for (const field of imageFields) {
      if (files?.[field]?.[0]?.location) {
        const newLocation = files[field][0].location;
        const oldLocation = layout[field];
        if (oldLocation) {
          try {
            await deleteSingleFile(oldLocation);
            console.log(`✅ Old ${field} deleted successfully`);
          } catch (err) {
            console.error(`❌ S3 Cleanup failed for ${field}:`, err.message);
          }
        }
        layout[field] = newLocation;
      }
    }
    const nestedFields = ['hours', 'socialLinks'];
    nestedFields.forEach(field => {
      if (body[field]) {
        layout[field] = {
          ...(layout[field]?.toObject?.() || layout[field] || {}), 
          ...body[field],
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
    const result = await CafeLayout.find(filter, options);
    return result;
  },
  getLayoutById: async (id) => {
    const layout = await CafeLayout.findById(id);
    return layout;
  },
  getDefaultLayout: async (id) => {
    const result = await CafeLayout.findById(id)
      .populate("adminId", "logo address phoneNumber email cafeName gst").populate("menus");
    return result;
  },
};
export default layoutService;