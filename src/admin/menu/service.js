import Menu from "../../../model/menu.js";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "../../../config/s3.js";
import Category from "../../../model/category.js";
import { deleteSingleFile } from "../../../utils/s3utils.js";

const getS3Key = (value) => {
  if (!value) return null;
  if (!value.startsWith("http")) return value;
  const url = new URL(value);
  return url.pathname.substring(1);
};

const menuService = {
createMenu: async (adminId, body, file) => {
  if (!file) {
    throw Object.assign(new Error("Image is required"), { statusCode: 400 });
  }
  const categoryExists = await Category.findOne({ 
    name: { $regex: new RegExp(`^${body.category}$`, "i") } 
  });
  if (!categoryExists) {
    throw Object.assign(new Error(`Category '${body.category}' does not exist`), { 
      statusCode: 404 
    });
  }
const menu = await Menu.create({
    ...body,
    adminId,
    category: categoryExists.name, 
    image: file.location,
    price: Number(body.price),
    discountPrice: body.discountPrice ? Number(body.discountPrice) : undefined,
  });
  return menu;
},
  updateMenu: async (menuId, body, file) => {
    const menu = await Menu.findById(menuId);
    if (!menu) {
      throw Object.assign(new Error("Menu not found"), { statusCode: 404 });
    }
    if (file?.location) {
      if (menu.image) {
        try {
          await deleteSingleFile(menu.image);
        } catch (err) {
          console.error('❌ S3 Delete Error:', err.message);
        }
      }
      body.image = file.location;
    }
    Object.assign(menu, body);
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
  getAllMenus: async (filter, options) => {
    return await Menu.paginate(filter, options);
  },
  getPublicMenus: async (adminId, query) => {
    const filter = { adminId };
    if (query.category) {
      filter.category = query.category;
    }
    if (query.search) {
      filter.name = { $regex: query.search, $options: "i" };
    }
    const menus = await Menu.find(filter)
      .select(
        "name description image price discountPrice category"
      )
      .populate("category", "name")
      .sort({ createdAt: -1 });
    return menus;
  },
  getMenusByAdmin: async (adminId, filter, options) => {
    filter.adminId = adminId;
    if(filter.search) {
      filter.name = { $regex: filter.search, $options: "i" };
    }
    delete filter.search;
    return await Menu.paginate(filter, options);
},
getMenuById: async (menuId) => {
  const menu = await Menu.findById(menuId); 
  return menu;
},
};
export default menuService;