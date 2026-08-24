import DashboardRepository from "./dashboard.repository.js";
import InventoryService from "../inventory/inventory.service.js";

class DashboardService {
  // Un solo endpoint que arma todo lo que necesita la pantalla principal
  // del admin, en vez de que el frontend tenga que hacer 6-7 llamadas
  // sueltas al cargar /admin.
  async getOverview() {
    const [
      orderTotals,
      revenueByDay,
      ordersByStatus,
      recentOrders,
      topProducts,
      customers,
      products,
      pendingReviews,
      inventorySummary,
    ] = await Promise.all([
      DashboardRepository.getOrderTotals(),
      DashboardRepository.getRevenueByDay(14),
      DashboardRepository.getOrdersByStatus(),
      DashboardRepository.getRecentOrders(8),
      DashboardRepository.getTopProducts(5),
      DashboardRepository.getCustomerCounts(),
      DashboardRepository.getProductCounts(),
      DashboardRepository.getPendingReviewsCount(),
      InventoryService.getSummary(),
    ]);

    return {
      orders: orderTotals,
      revenueByDay,
      ordersByStatus,
      recentOrders,
      topProducts,
      customers,
      products,
      pendingReviews,
      inventory: inventorySummary,
    };
  }
}

export default new DashboardService();
