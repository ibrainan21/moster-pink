import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import PurchaseService from "./purchase.service.js";

class PurchaseController {
  // GET /api/purchases  (RF-028, CU-017 lectura)
  list = asyncHandler(async (req, res) => {
    const result = await PurchaseService.list(req.query);
    res.json(ApiResponse.success("Compras obtenidas correctamente.", result));
  });

  // GET /api/purchases/:id
  getOne = asyncHandler(async (req, res) => {
    const purchase = await PurchaseService.getById(req.params.id);
    res.json(ApiResponse.success("Compra obtenida correctamente.", purchase));
  });

  // POST /api/purchases  (RF-026, CU-017)
  create = asyncHandler(async (req, res) => {
    const purchase = await PurchaseService.create(req.body, req.user);
    res.status(201).json(ApiResponse.success("Orden de compra creada correctamente.", purchase));
  });

  // PATCH /api/purchases/:id/receive  (RF-027, CU-018)
  markReceived = asyncHandler(async (req, res) => {
    const purchase = await PurchaseService.markReceived(req.params.id, req.user);
    res.json(
      ApiResponse.success("Compra marcada como recibida. El inventario se actualizó automáticamente.", purchase)
    );
  });

  // PATCH /api/purchases/:id/cancel
  cancel = asyncHandler(async (req, res) => {
    const purchase = await PurchaseService.cancel(req.params.id);
    res.json(ApiResponse.success("Compra cancelada.", purchase));
  });

  // POST /api/purchases/:id/payments
  addPayment = asyncHandler(async (req, res) => {
    const payment = await PurchaseService.addPayment(req.params.id, req.body);
    res.status(201).json(ApiResponse.success("Pago registrado correctamente.", payment));
  });

  // POST /api/purchases/:id/returns
  createReturn = asyncHandler(async (req, res) => {
    const result = await PurchaseService.createReturn(req.params.id, req.body);
    res
      .status(201)
      .json(ApiResponse.success("Devolución al proveedor registrada correctamente.", result));
  });
}

export default new PurchaseController();
