import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import OrderService from "./order.service.js";

class OrderController {
  // GET /api/orders  (RF-032, CU-008 para cliente / CU-020 para admin)
  list = asyncHandler(async (req, res) => {
    const result = await OrderService.list(req.query, req.user);
    res.json(ApiResponse.success("Pedidos obtenidos correctamente.", result));
  });

  // GET /api/orders/:id
  getOne = asyncHandler(async (req, res) => {
    const order = await OrderService.getByIdForUser(req.params.id, req.user);
    res.json(ApiResponse.success("Pedido obtenido correctamente.", order));
  });

  // POST /api/orders/checkout  (RF-030, CU-007)
  checkout = asyncHandler(async (req, res) => {
    const result = await OrderService.checkoutFromCart(req.user.id, req.body);
    res.status(201).json(ApiResponse.success("Pedido creado correctamente.", result));
  });

  // POST /api/orders/:id/confirm-payment
  // (simula la confirmación de Mercado Pago; en producción la llama el webhook)
  confirmPayment = asyncHandler(async (req, res) => {
    const result = await OrderService.confirmPayment(req.params.id, req.body);
    res.json(ApiResponse.success("Pago confirmado. El pedido ahora está pagado.", result));
  });

  // PATCH /api/orders/:id/status  (RF-031, CU-020)
  updateStatus = asyncHandler(async (req, res) => {
    const order = await OrderService.updateStatus(req.params.id, req.body.status, req.user);
    res.json(ApiResponse.success("Estado del pedido actualizado.", order));
  });

  // POST /api/orders/:id/shipment
  createShipment = asyncHandler(async (req, res) => {
    const shipment = await OrderService.createShipment(req.params.id, req.body);
    res.status(201).json(ApiResponse.success("Envío registrado correctamente.", shipment));
  });

  // PATCH /api/orders/shipments/:shipmentId
  updateShipmentStatus = asyncHandler(async (req, res) => {
    const shipment = await OrderService.updateShipmentStatus(req.params.shipmentId, req.body.status);
    res.json(ApiResponse.success("Estado del envío actualizado.", shipment));
  });

  // POST /api/orders/:id/returns  (RF-034)
  createReturn = asyncHandler(async (req, res) => {
    const result = await OrderService.createReturn(req.params.id, req.body, req.user);
    res.status(201).json(ApiResponse.success("Devolución registrada correctamente.", result));
  });
}

export default new OrderController();
