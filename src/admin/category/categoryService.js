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

 getAllCategories :async (filter) => {
    const result = await Category.find(filter).sort({ createdAt: -1 });
    return result;
},

updateCategoryById : async (categoryId, data) => {
 return await Category.findByIdAndUpdate(categoryId, data, { new: true });
},

 deleteCategoryById : async (categoryId) => {
  const category = await Category.findByIdAndDelete(categoryId);
  if (!category) {
    throw new Error("Category not found");
  }
  return category;
}
};
export default categoryService;

