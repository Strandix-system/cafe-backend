import Menu from "../../../model/menu.js";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "../../../config/s3.js";
import { deleteUploadedFiles, getS3Key } from "../../../utils/s3utils.js";

const menuService = {
  createMenu: async (adminId, body, file) => {
    if (!file) {
      const err = new Error("Image is required");
      err.statusCode = 400;
      throw err;
    }
    const { price, discountPrice } = body;
    if (!price || isNaN(price) || Number(price) <= 0) {
      throw Object.assign(new Error("Valid price is required"), {
        statusCode: 400,
      });
    }
    if (
      discountPrice &&
      Number(discountPrice) >= Number(price)
    ) {
      throw Object.assign(new Error("Discount price must be less than price"), {
        statusCode: 400,
      });
    }
    const menu = await Menu.create({
      adminId,
      image: file.location, // S3 URL
      price: Number(price),
      discountPrice: discountPrice ? Number(discountPrice) : undefined,
    });

    return menu;
  },
  updateMenu: async (menuId, body, file) => {
    const menu = await Menu.findById(menuId);
    if (!menu) {
      // cleanup newly uploaded image if menu doesn't exist
      if (file?.location) {
        const newKey = getS3Key(file.location);
        if (newKey) {
          await s3.send(
            new DeleteObjectCommand({
              Bucket: process.env.S3_BUCKET_NAME,
              Key: newKey,
            })
          );
        }
      }
      throw Object.assign(new Error("Menu not found"), { statusCode: 404 });
    }

    const { price, discountPrice } = body;

    if (price && (isNaN(price) || Number(price) <= 0)) {
      throw Object.assign(new Error("Invalid price"), { statusCode: 400 });
    }

    if (
      discountPrice &&
      Number(discountPrice) >= Number(price || menu.price)
    ) {
      throw Object.assign(new Error("Discount price must be less than price"), {
        statusCode: 400,
      });
    }

    const oldImage = menu.image;
    const isReplacingImage = Boolean(file?.location);

    // set new image URL (S3 upload already happened in multer middleware)
    if (isReplacingImage) {
      menu.image = file.location;
    }

    if (price) menu.price = Number(price);
    if (discountPrice) menu.discountPrice = Number(discountPrice);

    try {
      await menu.save();
    } catch (err) {
      // if DB update fails, remove the newly uploaded image from S3
      if (isReplacingImage) {
        const newKey = getS3Key(file.location);
        if (newKey) {
          await s3.send(
            new DeleteObjectCommand({
              Bucket: process.env.S3_BUCKET_NAME,
              Key: newKey,
            })
          );
        }
      }
      throw err;
    }

    // after successful save, delete the old image from S3
    if (isReplacingImage && oldImage && oldImage !== menu.image) {
      await deleteUploadedFiles([{ location: oldImage }]);
    }

    return menu;
  },

  deleteMenu: async (menuId) => {
    const menu = await Menu.findById(menuId);
    if (!menu) {
      throw Object.assign(new Error("Menu not found"), { statusCode: 404 });
    }

    if (menu.image) {
  const key = getS3Key(menu.image);

  if (key) {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: key,
      })
    );
  }
}

    await menu.deleteOne();
    return true;
  },
  getAllMenus: async (adminId, options) => {
    const filter = { adminId };
    return await Menu.paginate(filter, options);
  },
};

export default menuService;
