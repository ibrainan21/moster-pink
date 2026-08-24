import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import DashboardService from "./dashboard.service.js";

class DashboardController {
  getOverview = asyncHandler(async (req, res) => {
    const overview = await DashboardService.getOverview();
    res.json(ApiResponse.success("Resumen del dashboard obtenido correctamente.", overview));
  });
}

export default new DashboardController();
