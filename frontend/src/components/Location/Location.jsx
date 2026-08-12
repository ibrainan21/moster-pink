import { MapPin, Clock, MessageCircle } from "lucide-react";
import useFetch from "../../hooks/useFetch";
import contentService from "../../services/content.service";
import styles from "./Location.module.css";

/**
 * Location
 * "Visítanos" + "¿Dudas? Escríbenos por WhatsApp", con la dirección y
 * teléfono reales de la empresa (GET /api/content/company).
 *
 * El mapa es un bloque visual estático: integrar un mapa real (Google Maps
 * / Leaflet) requiere una API key que todavía no está configurada; cuando
 * la tengas, este bloque es el que se reemplaza por el mapa embebido.
 * El horario de atención no tiene todavía un campo en la base de datos
 * (no forma parte de la tabla "company"), así que por ahora es fijo.
 */
function Location() {
  const { data: company } = useFetch((signal) => contentService.getCompany(signal), []);

  const whatsappNumber = company?.phone?.replace(/\D/g, "");

  return (
    <section className={styles.section}>
      <div className={styles.mapPlaceholder}>
        <MapPin size={32} color="#ff5c93" />
      </div>

      <div className={styles.info}>
        <h3 className={styles.title}>
          Visítanos {company?.address ? `en ${company.address}` : ""}
        </h3>

        <p className={styles.line}>
          <MapPin size={16} />
          {company?.address || "Dirección próximamente"}
        </p>

        <p className={styles.line}>
          <Clock size={16} />
          Lunes a Domingo: 8:00 am – 6:00 pm
        </p>

        <a href="#ubicacion" className={styles.button}>
          Cómo llegar
        </a>
      </div>

      <div className={styles.whatsapp}>
        <p className={styles.whatsappTitle}>¿Dudas?</p>
        <p className={styles.whatsappSubtitle}>Escríbenos por WhatsApp, ¡estamos para ayudarte!</p>

        {whatsappNumber ? (
          <a
            href={`https://wa.me/${whatsappNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.whatsappButton}
          >
            <MessageCircle size={18} />
            WhatsApp
          </a>
        ) : (
          <span className={styles.whatsappButton} style={{ opacity: 0.6 }}>
            <MessageCircle size={18} />
            WhatsApp
          </span>
        )}
      </div>
    </section>
  );
}

export default Location;
