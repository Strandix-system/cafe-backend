import Category from "../../../model/category.js";
import Menu from "../../../model/menu.js";
const categoryService = {
 createCategory : async (data) => {
  const exists = await Category.findOne({ name: data.name });
  if (exists) {
    throw new Error("Category already exists");
  }
   const result = await Category.create(data);
  return result;
},
 getAllCategories :async (filter, options) => {
  if(filter.search){
   filter.name = { $regex: filter.search, $options:"i"};
   delete filter.search;
  }
    const result = await Category.paginate(filter, options);
    return result;
},
updateCategoryById: async (categoryId, data) => {
  const category = await Category.findById(categoryId);
  if (!category) {
    throw Object.assign(new Error("Category not found"), { statusCode: 404 });
  }
  const updatedCategory = await Category.findByIdAndUpdate(
    categoryId,
    { $set: data },
    { new: true, runValidators: true }
  );
  return updatedCategory;
},
 deleteCategoryById : async (categoryId) => {
  const category = await Category.findByIdAndDelete(categoryId);
  if (!category) {
    throw Object.assign(new Error("Category not found"), { statusCode: 404 });
  }
  return category;
},
getCategoryById : async (categoryId) => {
  const category = await Category.findById(categoryId);
  if (!category) {
    throw Object.assign(new Error("Category not found"), { statusCode: 404 });
  } 
  return category;
},
getCategoriesForDropdown : async () => {
  return await Category.find()
    .select("_id name")
    .sort({ name: 1 });
},
getAdminUsedCategories: async (adminId, filter, options) => {

  // Step 1: get category ids used in menu
  const usedCategoryIds = await Menu.distinct("category", { adminId });

  // Step 2: build query using _id (NOT name)
  const query = {
    _id: { $in: usedCategoryIds }
  };

  // Optional search
  if (filter.search) {
    query.name = { $regex: filter.search, $options: "i" };
  }

  // Step 3: paginate properly (only 2 params)
  const result = await Category.paginate(query, options);

  return result;
},
};
export default categoryService;

