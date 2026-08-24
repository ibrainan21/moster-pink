// Etiquetas y clases de estado para las páginas de "Mis pedidos" (lista y
// detalle), en el mismo espíritu que admin/pages/Orders/orderStatus.js
// pero con sus propias clases CSS (estas páginas no comparten módulo CSS
// con el panel administrativo).
export const STATUS_LABELS = {
  PENDING: "Pendiente de pago",
  PAID: "Pagado",
  PREPARING: "Preparando",
  SHIPPED: "Enviado",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
};

export const STATUS_CLASS = {
  PENDING: "statusPending",
  PAID: "statusPaid",
  PREPARING: "statusPreparing",
  SHIPPED: "statusShipped",
  DELIVERED: "statusDelivered",
  CANCELLED: "statusCancelled",
};

export const SHIPMENT_STATUS_LABELS = {
  PENDING: "Pendiente",
  SHIPPED: "Enviado",
  IN_TRANSIT: "En tránsito",
  DELIVERED: "Entregado",
  RETURNED: "Devuelto",
};

// RN-030 / review.repository.userPurchasedProductInOrder: solo se puede
// opinar sobre pedidos que ya no están pendientes ni cancelados.
export const canReviewOrder = (status) => status !== "PENDING" && status !== "CANCELLED";
