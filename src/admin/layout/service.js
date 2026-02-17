import CafeLayout from "../../../model/layout.js";
import { deleteUploadedFiles } from "../../../utils/s3utils.js";
import { deleteSingleFile } from "../../../utils/s3utils.js";
import Qr from "../../../model/qr.js"
import mongoose from "mongoose";

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
    const haveLayout = await CafeLayout.findOne({ adminId });
    const layout = await CafeLayout.create({
      ...body,
      adminId,
      homeImage, // S3 URL
      aboutImage, // S3 URL
      defaultLayout,
      active: !haveLayout
    });
    return layout;
  },
  updateCafeLayout: async (id, body, files) => {
    const layout = await CafeLayout.findById(id);
    if (!layout) {
      throw Object.assign(new Error("Cafe layout not found"), { statusCode: 404 });
    }

    // ✅ Home Image Update
    if (files?.homeImage?.[0]?.location) {
      if (layout.homeImage) {
        await deleteSingleFile(layout.homeImage)
          .catch(err => console.error("S3 Error:", err));
      }
      layout.homeImage = files.homeImage[0].location;
    }

    // ✅ About Image Update
    if (files?.aboutImage?.[0]?.location) {
      if (layout.aboutImage) {
        await deleteSingleFile(layout.aboutImage)
          .catch(err => console.error("S3 Error:", err));
      }
      layout.aboutImage = files.aboutImage[0].location;
    }

    // ✅ Directly assign all body fields
    Object.assign(layout, body);

    await layout.save();

    return layout;
  },
  updateLayoutStatus: async (body) => {
    const { layoutId, active } = body;
    const layout = await CafeLayout.findById(layoutId);
    if (!layout) {
      throw Object.assign(new Error("Cafe layout not found"), { statusCode: 404 });
    }

    if (active === undefined || typeof active !== "boolean") {
      throw Object.assign(new Error("Active status is required"), { statusCode: 400 });
    }

    if (active === true) {
      // 1️⃣ Deactivate all OTHER layouts of same admin
      await CafeLayout.updateMany(
        {
          adminId: layout?.adminId,
          _id: { $ne: layout?._id },
        },
        { $set: { active: false } }
      );

      layout.active = true;
    } else {
      layout.active = false;
    }

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

    const cafeQr = await Qr.findOne({ adminId: filter.adminId });

    return { ...result, cafeQr };
  },
  getAllLayout: async (filter, options) => {
    const result = await CafeLayout.paginate(filter, options);
    return result;
  },
  getLayoutById: async (id) => {
    const layout = await CafeLayout.findById(id).populate("adminId");
    return layout;
  },
  getActiveLayout: async (adminid) => {
    const result = await CafeLayout.findOne({ adminId: adminid, active: true })
      .populate("adminId").populate("menus");
    return result;
  },
};
export default layoutService;
