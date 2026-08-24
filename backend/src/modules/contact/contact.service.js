import CompanyRepository from "../content/company.repository.js";
import { sendContactMessage } from "../../utils/mailer.js";

class ContactService {
  // Manda el mensaje del formulario /contacto al correo de la tienda.
  // No guardamos estos mensajes en base de datos (no hay una tabla para
  // esto todavía) — si más adelante se necesita historial/bandeja de
  // mensajes, aquí es donde se agregaría un ContactRepository.create(...).
  async send({ name, email, phone, subject, message }) {
    const company = await CompanyRepository.get();

    // A dónde llega el correo: el email de la empresa configurado en el
    // panel (Content > Empresa) si existe, si no SMTP_USER como fallback
    // (la misma cuenta que se usa para enviar).
    const to = company?.email || process.env.SMTP_USER;

    await sendContactMessage(to, { name, email, phone, subject, message });
  }
}

export default new ContactService();
