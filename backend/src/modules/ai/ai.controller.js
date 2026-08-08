import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import RecommendationService from "./recommendation.service.js";
import TrackingService from "./tracking.service.js";

class AiController {
  // POST /api/ai/recommend  (RF-045, CU-037)
  // Funciona con o sin sesión iniciada (optionalAuth): un visitante también
  // puede usar el recomendador, solo que sin historial ligado a su cuenta.
  recommend = asyncHandler(async (req, res) => {
    const result = await RecommendationService.recommend(
      req.body,
      req.user?.id || null,
      req.body.sessionToken
    );
    res.json(ApiResponse.success("Recomendaciones generadas correctamente.", result));
  });

  // GET /api/ai/recommendations/mine
  listMine = asyncHandler(async (req, res) => {
    const recommendations = await RecommendationService.listMine(req.user.id);
    res.json(ApiResponse.success("Tus recomendaciones obtenidas correctamente.", recommendations));
  });

  // POST /api/ai/track/view  (RF-047)
  logView = asyncHandler(async (req, res) => {
    await TrackingService.logProductView({
      productId: req.body.productId,
      userId: req.user?.id || null,
      sessionToken: req.body.sessionToken,
      durationSeconds: req.body.durationSeconds,
    });
    res.status(201).json(ApiResponse.success("Vista registrada."));
  });

  // POST /api/ai/track/search  (RF-047)
  logSearch = asyncHandler(async (req, res) => {
    await TrackingService.logSearch({
      userId: req.user?.id || null,
      sessionToken: req.body.sessionToken,
      query: req.body.query,
      resultsCount: req.body.resultsCount,
    });
    res.status(201).json(ApiResponse.success("Búsqueda registrada."));
  });

  // GET /api/ai/insights  (panel admin: qué tanto se usa / qué tan bien funciona)
  getInsights = asyncHandler(async (req, res) => {
    const [insights, recommendationStats] = await Promise.all([
      TrackingService.getInsights(),
      RecommendationService.getStats(),
    ]);
    res.json(
      ApiResponse.success("Estadísticas de IA obtenidas correctamente.", {
        ...insights,
        recommendations: recommendationStats,
      })
    );
  });
}

export default new AiController();
