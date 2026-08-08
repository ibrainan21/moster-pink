import ApiError from "../../utils/ApiError.js";
import RecommendationRepository from "./recommendation.repository.js";

class RecommendationService {
  // RF-045: preguntas sobre persona, edad, presupuesto y ocasión.
  async recommend({ persona, age, budget, occasion, categoryId }, userId, sessionToken) {
    if (!budget) {
      throw new ApiError(400, "El presupuesto es obligatorio para generar recomendaciones.");
    }

    const candidates = await RecommendationRepository.findCandidates({
      budget,
      occasion,
      categoryId,
    });

    // RN-047: la plataforma sigue funcionando aunque no haya nada que
    // recomendar; simplemente se regresa una lista vacía con un mensaje.
    if (!candidates.length) {
      return { products: [], message: "No encontramos productos dentro de ese presupuesto todavía." };
    }

    // RF-046, RN-045: se registra el proceso, sin bloquear la respuesta al
    // usuario si el guardado falla (RN-047: independencia de los módulos de IA).
    try {
      await RecommendationRepository.logRecommendations({
        userId,
        sessionToken,
        criteria: { persona, age, budget, occasion, categoryId },
        products: candidates,
      });
    } catch (err) {
      console.error("No se pudo registrar la recomendación en el dataset:", err.message);
    }

    return { products: candidates };
  }

  async listMine(userId) {
    return RecommendationRepository.listByUser(userId);
  }

  async getStats() {
    return RecommendationRepository.getStats();
  }

  // Se invoca desde el checkout (de forma no bloqueante) para saber si el
  // cliente compró algo que le habíamos recomendado antes (RN-046: esto NO
  // modifica el pedido ni el inventario, solo enriquece el dataset).
  async markPurchased(userId, productIds) {
    try {
      await RecommendationRepository.markRecommendationsAsPurchased(userId, productIds);
    } catch (err) {
      console.error("No se pudo actualizar el dataset de recomendaciones:", err.message);
    }
  }
}

export default new RecommendationService();
