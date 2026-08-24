// Compartido entre AdminOrders (lista) y AdminOrderDetail (detalle) para
// que las etiquetas/colores de estado no se dupliquen ni se desincronicen.
export const STATUS_LABELS = {
  PENDING: "Pendiente",
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
