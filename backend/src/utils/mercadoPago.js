// RF-030: integración real con Mercado Pago (Checkout Pro).
//
// Si MP_ACCESS_TOKEN no está configurado en el .env, se cae de vuelta al
// comportamiento stub anterior (útil para desarrollar sin cuenta de
// Mercado Pago). En cuanto agregues tus credenciales de prueba/producción
// en el .env, esta función empieza a crear preferencias reales
// automáticamente, sin tocar nada más del checkout.
import { MercadoPagoConfig, Preference, Payment } from "mercadopago";

const client = process.env.MP_ACCESS_TOKEN
  ? new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN })
  : null;

if (!client) {
  console.warn(
    "⚠️  MP_ACCESS_TOKEN no configurado: Mercado Pago funcionará en modo stub (preferencias simuladas)."
  );
}

// Mercado Pago exige que auto_return solo se use con back_urls públicas y
// alcanzables por internet: con CLIENT_URL=http://localhost:... la API
// rechaza la preferencia con "auto_return invalid. back_url.success must
// be defined", aunque success SÍ esté definido (el mensaje es engañoso).
// Mientras desarrollas en localhost simplemente no mandamos auto_return
// -- el checkout de MP sigue funcionando igual, solo que al terminar el
// pago el cliente ve un botón "Volver al sitio" en vez de que lo regrese
// automáticamente. En cuanto CLIENT_URL sea un dominio público real
// (producción, o un túnel https tipo ngrok) esto se reactiva solo.
const isLocalClientUrl = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(
  process.env.CLIENT_URL || ""
);

// RF-030: crea la preferencia de pago y devuelve la URL de checkout a la
// que se debe redirigir al cliente.
export const createMercadoPagoPreference = async ({ orderId, amount, description }) => {
  if (!client) {
    console.log(
      `💳 [MERCADO PAGO STUB] Preferencia simulada para pedido #${orderId} por $${amount} (${description})`
    );

    return {
      id: `stub-preference-${orderId}`,
      init_point: `https://sandbox.mercadopago.com/checkout/stub/${orderId}`,
    };
  }

  const preference = new Preference(client);

  const result = await preference.create({
    body: {
      items: [
        {
          id: String(orderId),
          title: description,
          quantity: 1,
          unit_price: Number(amount),
          currency_id: process.env.MP_CURRENCY || "PEN",
        },
      ],
      // external_reference es lo que nos permite, en el webhook, saber a
      // qué pedido de nuestra base de datos corresponde el pago de MP.
      external_reference: String(orderId),
      // OJO: estas rutas deben existir de verdad en el router del
      // frontend (ver AppRouter.jsx) o Mercado Pago devuelve al cliente
      // a una página en blanco / 404 después de pagar. El pedido ya
      // existe con este id desde antes de crear la preferencia, así que
      // /pedido-confirmado/:id sirve tanto para success como para
      // pending (esa página ya muestra el estado real del pedido).
      back_urls: {
        success: `${process.env.CLIENT_URL}/pedido-confirmado/${orderId}`,
        failure: `${process.env.CLIENT_URL}/carrito`,
        pending: `${process.env.CLIENT_URL}/pedido-confirmado/${orderId}`,
      },
      ...(isLocalClientUrl ? {} : { auto_return: "approved" }),
      // A esta URL nos llega la notificación de Mercado Pago cuando el pago
      // cambia de estado (ver order.controller.js -> mercadoPagoWebhook).
      notification_url: `${process.env.BACKEND_URL}/api/orders/webhook/mercadopago`,
    },
  });

  return {
    id: result.id,
    init_point: result.init_point,
  };
};

// Usado por el webhook: nunca confiamos en el monto/estado que venga en la
// notificación en sí, siempre se vuelve a consultar el pago directo contra
// la API de Mercado Pago antes de marcar un pedido como pagado.
export const getMercadoPagoPayment = async (paymentId) => {
  if (!client) return null;

  const payment = new Payment(client);
  return payment.get({ id: paymentId });
};
