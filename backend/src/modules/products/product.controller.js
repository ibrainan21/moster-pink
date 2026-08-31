import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import ProductService from "./product.service.js";

class ProductController {
  // GET /api/products  (CU-004)
  list = asyncHandler(async (req, res) => {
    const result = await ProductService.list(req.query);
    res.json(ApiResponse.success("Productos obtenidos correctamente.", result));
  });

  // GET /api/products/:id  (panel administrativo)
  getOne = asyncHandler(async (req, res) => {
    const product = await ProductService.getById(req.params.id);
    res.json(ApiResponse.success("Producto obtenido correctamente.", product));
  });

  // GET /api/products/slug/:slug  (CU-005, tienda pública)
  getBySlug = asyncHandler(async (req, res) => {
    const product = await ProductService.getBySlug(req.params.slug);
    res.json(ApiResponse.success("Producto obtenido correctamente.", product));
  });

  // POST /api/products  (RF-006, CU-012)
  create = asyncHandler(async (req, res) => {
    const product = await ProductService.create(req.body, req.user);
    res.status(201).json(ApiResponse.success("Producto creado correctamente.", product));
  });

  // PUT /api/products/:id  (RF-007, CU-013)
  update = asyncHandler(async (req, res) => {
    const product = await ProductService.update(req.params.id, req.body, req.user);
    res.json(ApiResponse.success("Producto actualizado correctamente.", product));
  });

  // PATCH /api/products/:id/status  (RF-008, RF-008.1)
  updateStatus = asyncHandler(async (req, res) => {
    const product = await ProductService.updateStatus(req.params.id, req.body.status);
    res.json(ApiResponse.success("Estado del producto actualizado.", product));
  });

  // DELETE /api/products/:id
  remove = asyncHandler(async (req, res) => {
    await ProductService.remove(req.params.id);
    res.json(ApiResponse.success("Producto eliminado correctamente."));
  });

  // GET /api/products/:id/price-history  (RF-007, RF-028.1)
  priceHistory = asyncHandler(async (req, res) => {
    const history = await ProductService.getPriceHistory(req.params.id);
    res.json(ApiResponse.success("Historial de precios obtenido correctamente.", history));
  });

  // --- Imágenes ---

  // POST /api/products/:id/images  (multipart/form-data, campo "image")
  uploadImage = asyncHandler(async (req, res) => {
    const { variantId, isMain, imageUrl } = req.body;
    const image = await ProductService.uploadImage(req.params.id, req.file, {
      variantId: variantId || null,
      isMain: isMain === "true" || isMain === true,
      imageUrl: imageUrl || null,
    });
    res.status(201).json(ApiResponse.success("Imagen subida correctamente.", image));
  });

  // DELETE /api/products/:id/images/:imageId
  removeImage = asyncHandler(async (req, res) => {
    await ProductService.removeImage(req.params.id, req.params.imageId);
    res.json(ApiResponse.success("Imagen eliminada correctamente."));
  });

  // --- Variantes ---

  // GET /api/products/:productId/variants
  listVariants = asyncHandler(async (req, res) => {
    const variants = await ProductService.listVariants(req.params.productId);
    res.json(ApiResponse.success("Variantes obtenidas correctamente.", variants));
  });

  // POST /api/products/:productId/variants
  addVariant = asyncHandler(async (req, res) => {
    const variant = await ProductService.addVariant(req.params.productId, req.body);
    res.status(201).json(ApiResponse.success("Variante creada correctamente.", variant));
  });

  // PUT /api/products/variants/:id
  updateVariant = asyncHandler(async (req, res) => {
    const variant = await ProductService.updateVariant(req.params.id, req.body);
    res.json(ApiResponse.success("Variante actualizada correctamente.", variant));
  });

  // PATCH /api/products/variants/:id/status
  setVariantActive = asyncHandler(async (req, res) => {
    const variant = await ProductService.setVariantActive(req.params.id, req.body.isActive);
    res.json(ApiResponse.success("Estado de la variante actualizado.", variant));
  });
}

export default new ProductController();
