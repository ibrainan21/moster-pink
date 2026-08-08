// Integración real con Mercado Pago pendiente de conectar (RF-030).
// Igual que con el mailer, esto se deja como stub para no bloquear el resto
// del flujo de checkout: la orden se crea y el inventario se descuenta
// correctamente sin importar si el pago está simulado o es real.
//
// Cuando tengas tus credenciales de Mercado Pago (Documento 2, integración
// externa), reemplaza esta función por una llamada real a su SDK/API
// (crear preferencia de pago, redirigir al checkout, y procesar el webhook
// de confirmación en un endpoint aparte que llame a
// OrderService.confirmPayment()).
export const createMercadoPagoPreference = async ({ orderId, amount, description }) => {
  console.log(
    `💳 [MERCADO PAGO STUB] Preferencia simulada para pedido #${orderId} por $${amount} (${description})`
  );

  return {
    id: `stub-preference-${orderId}`,
    init_point: `https://sandbox.mercadopago.com/checkout/stub/${orderId}`,
  };
};
