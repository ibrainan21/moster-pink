import api from "./api";

// Envuelve /api/contact (ver backend: src/modules/contact/contact.routes.js).
// Ruta pública, sin sesión.
const contactService = {
  send: ({ name, email, phone, subject, message }) =>
    api.post("/contact", { name, email, phone, subject, message }),
};

export default contactService;
