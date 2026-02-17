import { get } from "http";
import Category from "../../../model/category.js";
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
     filter.name = { $regex: filter.search, $options: "i" };
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
};
export default categoryService;

