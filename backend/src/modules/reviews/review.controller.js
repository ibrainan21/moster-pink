import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import ReviewService from "./review.service.js";

class ReviewController {
  // GET /api/reviews/product/:productId  (público, CU-005)
  listByProduct = asyncHandler(async (req, res) => {
    const result = await ReviewService.listByProduct(req.params.productId);
    res.json(ApiResponse.success("Opiniones obtenidas correctamente.", result));
  });

  // GET /api/reviews/recent  (público, testimonios reales del Home)
  listRecent = asyncHandler(async (req, res) => {
    const reviews = await ReviewService.listRecent(req.query.limit);
    res.json(ApiResponse.success("Reseñas recientes obtenidas correctamente.", reviews));
  });

  // GET /api/reviews/mine
  listMine = asyncHandler(async (req, res) => {
    const reviews = await ReviewService.listMine(req.user.id);
    res.json(ApiResponse.success("Tus opiniones obtenidas correctamente.", reviews));
  });

  // GET /api/reviews  (panel administrativo, moderación)
  listAll = asyncHandler(async (req, res) => {
    const result = await ReviewService.listAll(req.query);
    res.json(ApiResponse.success("Reseñas obtenidas correctamente.", result));
  });

  // POST /api/reviews  (RF-036, CU-010)
  create = asyncHandler(async (req, res) => {
    const review = await ReviewService.create(req.user.id, req.body);
    res.status(201).json(ApiResponse.success("Opinión publicada correctamente.", review));
  });

  // DELETE /api/reviews/:id
  remove = asyncHandler(async (req, res) => {
    await ReviewService.remove(req.user.id, req.params.id, req.user);
    res.json(ApiResponse.success("Opinión eliminada correctamente."));
  });

  // PATCH /api/reviews/:id/approval  (moderación, Administrador)
  setApproved = asyncHandler(async (req, res) => {
    const review = await ReviewService.setApproved(req.params.id, req.body.isApproved);
    res.json(ApiResponse.success("Estado de moderación actualizado.", review));
  });
}

export default new ReviewController();
