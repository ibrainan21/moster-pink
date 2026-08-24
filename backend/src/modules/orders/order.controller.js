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

  // GET /api/orders/track?orderNumber=PED-000015&email=cliente@correo.com
  // (público, sin sesión — página /seguimiento)
  track = asyncHandler(async (req, res) => {
    const { orderNumber, email } = req.query;
    const result = await OrderService.trackPublic(orderNumber, email);
    res.json(ApiResponse.success("Pedido encontrado.", result));
  });

  // POST/GET /api/orders/webhook/mercadopago  (RF-030, ruta pública)
  // Mercado Pago llama esto directo (sin sesión de usuario) cuando un pago
  // cambia de estado. Solo devolvemos 200 para que MP no reintente la
  // notificación; el procesamiento real vive en el service.
  mercadoPagoWebhook = asyncHandler(async (req, res) => {
    const paymentId = req.query["data.id"] || req.body?.data?.id;
    const type = req.query.type || req.body?.type;

    // Log temporal de depuración: si esto NO aparece en tu consola después
    // de pagar, Mercado Pago no está llegando a tu backend (revisa ngrok).
    // Si SÍ aparece, el problema está más adelante (ver logs en
    // order.service.js -> handleMercadoPagoNotification).
    console.log("🔔 Webhook de Mercado Pago recibido:", {
      query: req.query,
      body: req.body,
      type,
      paymentId,
    });

    if (type === "payment" && paymentId) {
      await OrderService.handleMercadoPagoNotification(paymentId);
    } else {
      console.log("⚠️  Webhook ignorado: type/paymentId no reconocidos.");
    }

    res.sendStatus(200);
  });

  // POST /api/orders/:id/confirm-payment
  // (confirmación manual por un admin/empleado; el flujo real automático
  // llega por el webhook de arriba)
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
