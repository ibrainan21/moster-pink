// Envío de correo real pendiente de conectar con Gmail SMTP (Documento 2,
// Cap. 9 "Arquitectura de Integraciones"). Por ahora se deja este stub para
// no bloquear el flujo de recuperación de contraseña (RF-003): el código se
// genera y se guarda en la base de datos igual, y aquí solo falta reemplazar
// el console.log por el envío real (por ejemplo con "nodemailer").
export const sendPasswordResetEmail = async (toEmail, code) => {
  console.log(`📧 [MAILER STUB] Código de recuperación para ${toEmail}: ${code}`);
  // TODO: integrar nodemailer + Gmail SMTP (ver .env: agregar SMTP_USER, SMTP_PASS).
  return true;
};
