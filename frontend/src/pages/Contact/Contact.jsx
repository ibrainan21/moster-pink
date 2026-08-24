import { useState } from "react";
import { Mail, Phone, MapPin, User, MessageSquare } from "lucide-react";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import useFetch from "../../hooks/useFetch";
import contentService from "../../services/content.service";
import contactService from "../../services/contact.service";
import { ApiClientError } from "../../services/api";
import styles from "./Contact.module.css";

/**
 * Contact
 * Ruta pública /contacto. Muestra los datos de la empresa (GET
 * /api/content/company, ya existía y es pública) y un formulario que
 * manda el mensaje por correo a través de /api/contact (nuevo).
 */
function Contact() {
  const { data: company } = useFetch((signal) => contentService.getCompany(signal), []);

  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(false);

  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await contactService.send(form);
      setSent(true);
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "No se pudo enviar tu mensaje.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <Header />

      <div className={styles.wrapper}>
        <h1 className={styles.title}>Contáctanos</h1>
        <p className={styles.subtitle}>
          ¿Tienes dudas sobre un producto, un pedido o quieres un regalo personalizado? Escríbenos.
        </p>

        <div className={styles.grid}>
          <div className={styles.infoCard}>
            <h2 className={styles.infoTitle}>{company?.name || "Monster Pink"}</h2>

            {company?.phone && (
              <p className={styles.infoRow}>
                <Phone size={18} /> {company.phone}
              </p>
            )}
            {company?.email && (
              <p className={styles.infoRow}>
                <Mail size={18} /> {company.email}
              </p>
            )}
            {company?.address && (
              <p className={styles.infoRow}>
                <MapPin size={18} /> {company.address}
              </p>
            )}
          </div>

          <form className={styles.formCard} onSubmit={handleSubmit}>
            {sent && (
              <p className={styles.success}>
                ¡Tu mensaje fue enviado! Te responderemos lo antes posible.
              </p>
            )}
            {error && <p className={styles.error}>{error}</p>}

            <label className={styles.field}>
              <User size={18} />
              <input
                type="text"
                placeholder="Tu nombre"
                value={form.name}
                onChange={handleChange("name")}
                required
              />
            </label>

            <label className={styles.field}>
              <Mail size={18} />
              <input
                type="email"
                placeholder="Tu correo"
                value={form.email}
                onChange={handleChange("email")}
                required
              />
            </label>

            <label className={styles.field}>
              <Phone size={18} />
              <input
                type="tel"
                placeholder="Teléfono (opcional)"
                value={form.phone}
                onChange={handleChange("phone")}
              />
            </label>

            <label className={styles.field}>
              <MessageSquare size={18} />
              <input
                type="text"
                placeholder="Asunto (opcional)"
                value={form.subject}
                onChange={handleChange("subject")}
              />
            </label>

            <label className={styles.fieldTextarea}>
              <textarea
                placeholder="Cuéntanos en qué te ayudamos..."
                value={form.message}
                onChange={handleChange("message")}
                minLength={10}
                rows={5}
                required
              />
            </label>

            <button type="submit" className={styles.submitButton} disabled={submitting}>
              {submitting ? "Enviando..." : "Enviar mensaje"}
            </button>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default Contact;
