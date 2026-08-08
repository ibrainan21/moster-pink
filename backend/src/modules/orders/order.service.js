import ApiError from "../../utils/ApiError.js";
import OrderRepository from "./order.repository.js";
import CartRepository from "../cart/cart.repository.js";
import CouponService from "../promotions/coupon.service.js";
import RecommendationService from "../ai/recommendation.service.js";
import { createMercadoPagoPreference } from "../../utils/mercadoPago.js";

// RN-028: flujo de estados permitido. Esto es una segunda barrera (defensa
// en profundidad) además del trigger trg_orders_bu que ya vive en la base
// de datos; así el error se ve amigable desde el service, sin depender de
// interpretar el mensaje crudo de MySQL.
const ALLOWED_TRANSITIONS = {
  PENDING: ["PAID", "CANCELLED"],
  PAID: ["PREPARING", "CANCELLED"],
  PREPARING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

class OrderService {
  async getFullOrder(order) {
    const [details, payments, shipment, statusHistory, returns] = await Promise.all([
      OrderRepository.getDetails(order.id),
      OrderRepository.getPayments(order.id),
      OrderRepository.getShipment(order.id),
      OrderRepository.getStatusHistory(order.id),
      OrderRepository.getReturns(order.id),
    ]);
    return { ...order, details, payments, shipment, statusHistory, returns };
  }

  async getById(id) {
    const order = await OrderRepository.getById(id);
    if (!order) throw new ApiError(404, "Pedido no encontrado.");
    return this.getFullOrder(order);
  }

  // Un cliente solo puede ver sus propios pedidos; Admin/Empleado ven todos.
  async getByIdForUser(id, actingUser) {
    const order = await this.getById(id);
    if (actingUser.roleName === "Cliente" && order.user_id !== actingUser.id) {
      throw new ApiError(403, "No tienes acceso a este pedido.");
    }
    return order;
  }

  async list(query, actingUser) {
    const { page = 1, limit = 20, status, dateFrom, dateTo } = query;

    // Un cliente solo puede listar sus propios pedidos (RF-032, CU-008).
    const userId = actingUser.roleName === "Cliente" ? actingUser.id : query.userId || null;

    return OrderRepository.list({
      page,
      limit,
      userId,
      status: status || null,
      dateFrom: dateFrom || null,
      dateTo: dateTo || null,
    });
  }

  // RF-030, CU-007: checkout a partir del carrito del cliente.
  // RN-035: si viene un código de cupón, se valida (vigencia, límite de
  // usos, compra mínima) contra el subtotal real del carrito ANTES de
  // crear el pedido; el registro de uso (coupon_usage) se hace dentro de
  // la misma transacción que el pedido, en OrderRepository.create.
  async checkoutFromCart(userId, { addressId, notes, couponCode }) {
    const cart = await CartRepository.getByUser(userId);
    if (!cart.length) throw new ApiError(400, "Tu carrito está vacío.");

    for (const item of cart) {
      if (item.product_status !== "ACTIVE" || !item.variant_active) {
        throw new ApiError(400, `El producto "${item.product_name}" ya no está disponible.`);
      }
    }

    const warehouseId = await OrderRepository.getDefaultWarehouseId();
    if (!warehouseId) throw new ApiError(500, "No hay un almacén activo configurado.");

    const lines = cart.map((item) => ({
      variantId: item.variant_id,
      quantity: item.quantity,
      unitPrice: Number(item.base_price) + Number(item.additional_price),
    }));

    const subtotal = lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);

    let couponId = null;
    let discount = 0;

    if (couponCode) {
      // Si el cupón no es válido, CouponService.validate lanza el ApiError
      // correspondiente (código inexistente, vencido, no llega al mínimo, etc.)
      // y el checkout se detiene aquí, antes de tocar inventario.
      const { coupon, discount: couponDiscount } = await CouponService.validate(couponCode, subtotal);
      couponId = coupon.id;
      discount = couponDiscount;
    }

    let orderId;
    try {
      orderId = await OrderRepository.create({
        userId,
        addressId,
        warehouseId,
        lines,
        discount,
        couponId,
        notes,
      });
    } catch (err) {
      // El trigger trg_order_details_bi lanza un error SQL amigable cuando
      // no hay stock suficiente; lo traducimos a un ApiError 400 en vez de
      // dejar pasar un 500 genérico.
      if (err.sqlState === "45000") {
        throw new ApiError(400, err.sqlMessage || "No hay stock suficiente para completar el pedido.");
      }
      throw err;
    }

    await CartRepository.clear(userId);

    const order = await this.getById(orderId);

    // RN-046, RN-047: esto es "mejor esfuerzo" y nunca bloquea el checkout;
    // solo enriquece el dataset de IA (RF-047) marcando qué recomendaciones
    // sí terminaron en una compra.
    RecommendationService.markPurchased(
      userId,
      cart.map((item) => item.product_id)
    );

    // RF-030: generar la preferencia de pago con Mercado Pago (stub por ahora).
    const preference = await createMercadoPagoPreference({
      orderId,
      amount: order.total,
      description: `Pedido ${order.order_number} - Moster Pink`,
    });

    return { order, paymentUrl: preference.init_point };
  }

  // RN-027: el pedido solo pasa a "Pagado" cuando el proveedor de pago
  // confirma la transacción (aquí simulado; en producción esto lo dispara
  // el webhook de Mercado Pago llamando a confirmPayment).
  async confirmPayment(orderId, { paymentMethod, amount, reference }) {
    const order = await OrderRepository.getById(orderId);
    if (!order) throw new ApiError(404, "Pedido no encontrado.");

    if (order.status !== "PENDING") {
      throw new ApiError(400, "Este pedido no está pendiente de pago.");
    }

    const payment = await OrderRepository.addPayment(orderId, {
      paymentMethod: paymentMethod || "MERCADO_PAGO",
      amount,
      reference,
      status: "COMPLETED",
    });

    const updated = await this.updateStatus(orderId, "PAID", { id: null });
    return { payment, order: updated };
  }

  // RF-031, RN-028: cambio de estado con transición validada.
  async updateStatus(id, newStatus, actingUser) {
    const order = await OrderRepository.getById(id);
    if (!order) throw new ApiError(404, "Pedido no encontrado.");

    const allowed = ALLOWED_TRANSITIONS[order.status] || [];
    if (!allowed.includes(newStatus)) {
      throw new ApiError(
        400,
        `No se puede pasar de "${order.status}" a "${newStatus}". Transiciones permitidas: ${
          allowed.join(", ") || "ninguna, es un estado final"
        }.`
      );
    }

    try {
      await OrderRepository.updateStatus(id, newStatus);
    } catch (err) {
      if (err.sqlState === "45000") {
        throw new ApiError(400, err.sqlMessage || "Transición de estado no permitida.");
      }
      throw err;
    }

    return this.getById(id);
  }

  // --- Envíos ---

  async createShipment(orderId, data) {
    const order = await OrderRepository.getById(orderId);
    if (!order) throw new ApiError(404, "Pedido no encontrado.");
    return OrderRepository.createShipment(orderId, data);
  }

  async updateShipmentStatus(shipmentId, status) {
    return OrderRepository.updateShipmentStatus(shipmentId, status);
  }

  // --- Devoluciones del cliente (RF-034) ---

  async createReturn(orderId, data, actingUser) {
    const order = await OrderRepository.getById(orderId);
    if (!order) throw new ApiError(404, "Pedido no encontrado.");

    if (actingUser.roleName === "Cliente" && order.user_id !== actingUser.id) {
      throw new ApiError(403, "No puedes solicitar una devolución sobre un pedido que no es tuyo.");
    }

    if (!["DELIVERED", "SHIPPED"].includes(order.status)) {
      throw new ApiError(400, "Solo se pueden devolver pedidos ya enviados o entregados.");
    }

    if (!data.lines || !data.lines.length) {
      throw new ApiError(400, "La devolución debe tener al menos un producto.");
    }

    const returnId = await OrderRepository.createReturn({
      orderId,
      reason: data.reason,
      createdBy: actingUser.id,
      lines: data.lines,
    });

    return this.getById(orderId).then((o) => ({ order: o, returnId }));
  }
}

export default new OrderService();
