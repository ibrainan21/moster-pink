import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import PromotionService from "./promotion.service.js";
import SeasonService from "./season.service.js";
import CouponService from "./coupon.service.js";

class PromotionController {
  // --- Promociones (RF-038) ---

  listPromotions = asyncHandler(async (req, res) => {
    const promotions = await PromotionService.list(req.query.onlyActive === "true");
    res.json(ApiResponse.success("Promociones obtenidas correctamente.", promotions));
  });

  getPromotion = asyncHandler(async (req, res) => {
    const promotion = await PromotionService.getById(req.params.id);
    res.json(ApiResponse.success("Promoción obtenida correctamente.", promotion));
  });

  createPromotion = asyncHandler(async (req, res) => {
    const promotion = await PromotionService.create(req.body, req.user);
    res.status(201).json(ApiResponse.success("Promoción creada correctamente.", promotion));
  });

  updatePromotion = asyncHandler(async (req, res) => {
    const promotion = await PromotionService.update(req.params.id, req.body);
    res.json(ApiResponse.success("Promoción actualizada correctamente.", promotion));
  });

  setPromotionActive = asyncHandler(async (req, res) => {
    const promotion = await PromotionService.setActive(req.params.id, req.body.isActive);
    res.json(ApiResponse.success("Estado de la promoción actualizado.", promotion));
  });

  removePromotion = asyncHandler(async (req, res) => {
    await PromotionService.remove(req.params.id);
    res.json(ApiResponse.success("Promoción eliminada correctamente."));
  });

  // --- Temporadas (RF-011, RF-014) ---

  listSeasons = asyncHandler(async (req, res) => {
    const seasons = await SeasonService.list(req.query.onlyActive === "true");
    res.json(ApiResponse.success("Temporadas obtenidas correctamente.", seasons));
  });

  getSeason = asyncHandler(async (req, res) => {
    const season = await SeasonService.getById(req.params.id);
    res.json(ApiResponse.success("Temporada obtenida correctamente.", season));
  });

  createSeason = asyncHandler(async (req, res) => {
    const season = await SeasonService.create(req.body);
    res.status(201).json(ApiResponse.success("Temporada creada correctamente.", season));
  });

  updateSeason = asyncHandler(async (req, res) => {
    const season = await SeasonService.update(req.params.id, req.body);
    res.json(ApiResponse.success("Temporada actualizada correctamente.", season));
  });

  setSeasonActive = asyncHandler(async (req, res) => {
    const season = await SeasonService.setActive(req.params.id, req.body.isActive);
    res.json(ApiResponse.success("Estado de la temporada actualizado.", season));
  });

  removeSeason = asyncHandler(async (req, res) => {
    await SeasonService.remove(req.params.id);
    res.json(ApiResponse.success("Temporada eliminada correctamente."));
  });

  addSeasonProduct = asyncHandler(async (req, res) => {
    const season = await SeasonService.addProduct(req.params.id, req.body.productId);
    res.status(201).json(ApiResponse.success("Producto agregado a la temporada.", season));
  });

  removeSeasonProduct = asyncHandler(async (req, res) => {
    const season = await SeasonService.removeProduct(req.params.id, req.params.productId);
    res.json(ApiResponse.success("Producto eliminado de la temporada.", season));
  });

  // --- Cupones (RF-038, RN-035) ---

  listCoupons = asyncHandler(async (req, res) => {
    const coupons = await CouponService.list(req.query.onlyActive === "true");
    res.json(ApiResponse.success("Cupones obtenidos correctamente.", coupons));
  });

  createCoupon = asyncHandler(async (req, res) => {
    const coupon = await CouponService.create(req.body, req.user);
    res.status(201).json(ApiResponse.success("Cupón creado correctamente.", coupon));
  });

  setCouponActive = asyncHandler(async (req, res) => {
    const coupon = await CouponService.setActive(req.params.id, req.body.isActive);
    res.json(ApiResponse.success("Estado del cupón actualizado.", coupon));
  });

  // Validación pública: para mostrar el descuento antes de pagar.
  validateCoupon = asyncHandler(async (req, res) => {
    const result = await CouponService.validate(req.body.code, req.body.cartTotal);
    res.json(ApiResponse.success("Cupón válido.", result));
  });
}

export default new PromotionController();
