import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import CategoryService from "./category.service.js";

class CategoryController {
  // GET /api/categories
  list = asyncHandler(async (req, res) => {
    const categories = await CategoryService.list(req.query.onlyActive);
    res.json(ApiResponse.success("Categorías obtenidas correctamente.", categories));
  });

  // GET /api/categories/:id
  getOne = asyncHandler(async (req, res) => {
    const category = await CategoryService.getById(req.params.id);
    res.json(ApiResponse.success("Categoría obtenida correctamente.", category));
  });

  // GET /api/categories/slug/:slug
  getBySlug = asyncHandler(async (req, res) => {
    const category = await CategoryService.getBySlug(req.params.slug);
    res.json(ApiResponse.success("Categoría obtenida correctamente.", category));
  });

  // POST /api/categories  (RF-014, CU-015)
  create = asyncHandler(async (req, res) => {
    const category = await CategoryService.create(req.body);
    res.status(201).json(ApiResponse.success("Categoría creada correctamente.", category));
  });

  // PUT /api/categories/:id
  update = asyncHandler(async (req, res) => {
    const category = await CategoryService.update(req.params.id, req.body);
    res.json(ApiResponse.success("Categoría actualizada correctamente.", category));
  });

  // PATCH /api/categories/:id/status
  setActive = asyncHandler(async (req, res) => {
    const category = await CategoryService.setActive(req.params.id, req.body.isActive);
    res.json(ApiResponse.success("Estado de la categoría actualizado.", category));
  });

  // DELETE /api/categories/:id
  remove = asyncHandler(async (req, res) => {
    await CategoryService.remove(req.params.id);
    res.json(ApiResponse.success("Categoría eliminada correctamente."));
  });

  // --- Subcategorías ---

  // GET /api/categories/:categoryId/subcategories
  listSubcategories = asyncHandler(async (req, res) => {
    const subcategories = await CategoryService.listSubcategories(
      req.params.categoryId,
      req.query.onlyActive
    );
    res.json(ApiResponse.success("Subcategorías obtenidas correctamente.", subcategories));
  });

  // POST /api/categories/:categoryId/subcategories
  createSubcategory = asyncHandler(async (req, res) => {
    const subcategory = await CategoryService.createSubcategory(req.params.categoryId, req.body);
    res.status(201).json(ApiResponse.success("Subcategoría creada correctamente.", subcategory));
  });

  // PUT /api/categories/subcategories/:id
  updateSubcategory = asyncHandler(async (req, res) => {
    const subcategory = await CategoryService.updateSubcategory(req.params.id, req.body);
    res.json(ApiResponse.success("Subcategoría actualizada correctamente.", subcategory));
  });

  // PATCH /api/categories/subcategories/:id/status
  setSubcategoryActive = asyncHandler(async (req, res) => {
    const subcategory = await CategoryService.setSubcategoryActive(req.params.id, req.body.isActive);
    res.json(ApiResponse.success("Estado de la subcategoría actualizado.", subcategory));
  });

  // DELETE /api/categories/subcategories/:id
  removeSubcategory = asyncHandler(async (req, res) => {
    await CategoryService.removeSubcategory(req.params.id);
    res.json(ApiResponse.success("Subcategoría eliminada correctamente."));
  });
}

export default new CategoryController();
