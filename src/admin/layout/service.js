import LayoutTemplate from "../../../model/layout.model.js";
import CafeLayout from "../../../model/adminLayout.js";
import { deleteUploadedFiles } from "../../../utils/s3utils.js";
import { ApiError } from "../../../utils/apiError.js";

const layoutService = {
  // Superadmin creates template
  createLayout: async (body, files, admin) => {
    if (!files || !Array.isArray(files) || files.length !== body.noOfImage) {
      await deleteUploadedFiles(files);
      throw new Error("Images count should match total number of images");
    }

    const images = files.map((f) => f.location);

    const layout = await LayoutTemplate.create({
      noOfImage: body.noOfImage
    });

    if (!layout) {
      await deleteUploadedFiles(files);
      throw new ApiError(500, "Failed to create layout");
    }

    delete body.noOfImage;

    const defaultLayout = await CafeLayout.create({
      ...body,
      images,
      layoutId: layout?._id,
      adminId: admin?._id
    });

    if (!defaultLayout) {
      await deleteUploadedFiles(files);
      await LayoutTemplate.findByIdAndDelete(layout._id);
      throw new ApiError(500, "Failed to create default layout");
    }

    const updatedLayout = await LayoutTemplate.findByIdAndUpdate(
      layout._id,
      { defaultLayoutId: defaultLayout?._id },
      { new: true }
    );

    return updatedLayout;
  },
  getAllTemplates: async (query, options) => {
    const result = await LayoutTemplate.paginate(query, options);
    return result;
  },
  createCafeLayout: async (adminId, body, files) => {
    // Validation is now done in middleware before upload
    // Files are already validated and uploaded to S3 at this point
    const images = files.map((f) => f.location);

    const cafeLayout = await CafeLayout.create({
      adminId,
      layoutTemplateId: body.layoutTemplateId,
      cafeTitle: body.cafeTitle,
      description: body.description,
      images,
    });

    // Update LayoutTemplate: store this CafeLayout id in selectedLayoutTemplateId
    await LayoutTemplate.findByIdAndUpdate(body.layoutTemplateId, {
      selectedLayoutTemplateId: cafeLayout._id,
    });

    return cafeLayout;
  },
};

export default layoutService;
