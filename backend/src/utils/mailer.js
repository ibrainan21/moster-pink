// Envío de correo real vía Gmail SMTP con nodemailer.
//
// Si SMTP_USER / SMTP_PASS no están configurados en el .env, se cae al
// comportamiento anterior (imprimir el contenido en consola) para no
// bloquear el desarrollo local sin credenciales de correo.
//
// SMTP_PASS debe ser una "contraseña de aplicación" de Gmail (no la
// contraseña normal de la cuenta): Cuenta de Google > Seguridad >
// Verificación en 2 pasos > Contraseñas de aplicaciones.
import nodemailer from "nodemailer";

let transporter = null;
let warned = false;

const getTransporter = () => {
  if (transporter) return transporter;

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    if (!warned) {
      console.warn(
        "⚠️  SMTP_USER/SMTP_PASS no configurados: los correos se mostrarán en consola en vez de enviarse."
      );
      warned = true;
    }
    return null;
  }

  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
};

const send = async ({ to, subject, html }) => {
  const t = getTransporter();

  if (!t) {
    console.log(`📧 [MAILER - modo consola] Para: ${to} | Asunto: ${subject}\n${html}\n`);
    return true;
  }

  try {
    await t.sendMail({
      from: `"Moster Pink" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    return true;
  } catch (err) {
    // No queremos que un fallo de correo tumbe el flujo (login, checkout,
    // etc.); se registra el error y se sigue.
    console.error("❌ Error enviando correo:", err.message);
    return false;
  }
};

// RF-003: código de recuperación de contraseña.
export const sendPasswordResetEmail = async (toEmail, code) => {
  return send({
    to: toEmail,
    subject: "Recupera tu contraseña - Moster Pink",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; color:#333;">
        <h2 style="color:#e91e8c;">Moster Pink</h2>
        <p>Recibimos una solicitud para restablecer tu contraseña.</p>
        <p>Tu código de verificación es:</p>
        <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px;">${code}</p>
        <p>Este código vence en 15 minutos. Si tú no solicitaste esto, puedes ignorar este correo.</p>
      </div>
    `,
  });
};

// Formulario de /contacto: le llega a la tienda (ContactService decide el
// destinatario), con el correo del visitante como "reply-to" para poder
// contestarle directo desde el cliente de correo.
export const sendContactMessage = async (toEmail, { name, email, phone, subject, message }) => {
  if (!toEmail) {
    console.warn(
      "⚠️  No hay correo de destino para el formulario de contacto (falta company.email y SMTP_USER)."
    );
    return false;
  }

  const t = getTransporter();

  if (!t) {
    console.log(
      `📧 [MAILER - modo consola] Contacto de ${name} <${email}>${phone ? ` (${phone})` : ""} — ${subject || "Sin asunto"}\n${message}\n`
    );
    return true;
  }

  try {
    await t.sendMail({
      from: `"Moster Pink - Formulario de contacto" <${process.env.SMTP_USER}>`,
      to: toEmail,
      replyTo: email,
      subject: `[Contacto] ${subject || "Nuevo mensaje"} — ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; color:#333;">
          <h2 style="color:#e91e8c;">Nuevo mensaje de contacto</h2>
          <p><strong>Nombre:</strong> ${name}</p>
          <p><strong>Correo:</strong> ${email}</p>
          ${phone ? `<p><strong>Teléfono:</strong> ${phone}</p>` : ""}
          ${subject ? `<p><strong>Asunto:</strong> ${subject}</p>` : ""}
          <p><strong>Mensaje:</strong></p>
          <p style="white-space: pre-wrap;">${message}</p>
        </div>
      `,
    });
    return true;
  } catch (err) {
    console.error("❌ Error enviando el mensaje de contacto:", err.message);
    return false;
  }
};

// RF-030: confirmación de pedido pagado (se dispara desde
// OrderService.confirmPayment, tanto en confirmación manual como cuando
// llega la notificación real de Mercado Pago).
export const sendOrderConfirmationEmail = async (toEmail, order) => {
  if (!toEmail) return false;

  return send({
    to: toEmail,
    subject: `Pedido ${order.order_number} confirmado - Moster Pink`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; color:#333;">
        <h2 style="color:#e91e8c;">¡Gracias por tu compra!</h2>
        <p>Tu pedido <strong>${order.order_number}</strong> fue confirmado y ya lo estamos preparando.</p>
        <p>Total pagado: <strong>$${order.total}</strong></p>
      </div>
    `,
  });
};
