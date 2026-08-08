import TrackingRepository from "./tracking.repository.js";

class TrackingService {
  // Todas las llamadas de este service son "mejor esfuerzo": si fallan, no
  // deben tumbar la experiencia de navegación del cliente (RN-047).

  async logProductView(data) {
    try {
      await TrackingRepository.logProductView(data);
    } catch (err) {
      console.error("No se pudo registrar la vista de producto:", err.message);
    }
  }

  async logSearch(data) {
    try {
      await TrackingRepository.logSearch(data);
    } catch (err) {
      console.error("No se pudo registrar la búsqueda:", err.message);
    }
  }

  async getInsights() {
    const [mostViewed, topSearches, summary] = await Promise.all([
      TrackingRepository.getMostViewedProducts(),
      TrackingRepository.getTopSearches(),
      TrackingRepository.getDatasetSummary(),
    ]);
    return { mostViewed, topSearches, summary };
  }
}

export default new TrackingService();
