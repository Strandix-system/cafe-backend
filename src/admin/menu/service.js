import Menu from "../../../model/menu.js";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "../../../config/s3.js";

const getS3Key = (value) => {
  if (!value) return null;

  // If already a key (not URL)
  if (!value.startsWith("http")) return value;

  const url = new URL(value);
  return url.pathname.substring(1); // remove leading slash
};

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

    // 🔥 UPDATE IMAGE (DELETE OLD FROM S3)
   if (file?.location) {
  if (menu.image) {
    const oldKey = getS3Key(menu.image);

    if (oldKey) {
      await s3.send(
        new DeleteObjectCommand({
          Bucket: process.env.S3_BUCKET_NAME,
          Key: oldKey,
        })
      );
    }
  }

  menu.image = file.location; // save new image URL
}

    if (price) menu.price = Number(price);
    if (discountPrice) menu.discountPrice = Number(discountPrice);

    await menu.save();
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
