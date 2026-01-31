import LayoutTemplate from "../../../model/layoutTemplate.js";
import CafeLayout from "../../../model/adminLayout.js";
import { deleteUploadedFiles } from "../../../utils/s3utils.js";

const layoutService = {
  // 🟦 Superadmin creates template
  createTemplate: async (body) => {
    return await LayoutTemplate.create(body);
  },
  // 🟩 Admin fills cafe layout

  createCafeLayout: async (adminId, body, files) => {
    const template = await LayoutTemplate.findById(body.layoutTemplateId);
    if (!template) {
      await deleteUploadedFiles(files);
      throw new Error("Template not found");
    }
    if (!files || files.length !== template.noOfImage) {
      await deleteUploadedFiles(files);
      throw new Error(`Upload exactly ${template.noOfImage} images`);
    }
    const images = files.map((f) => f.location);

    return await CafeLayout.create({
      adminId,
      layoutTemplateId: body.layoutTemplateId,
      cafeTitle: body.cafeTitle,
      description: body.description,
      images,
    });
  },
};

export default layoutService;
