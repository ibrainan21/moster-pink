import { MapPin, Clock, MessageCircle } from "lucide-react";
import useFetch from "../../hooks/useFetch";
import contentService from "../../services/content.service";
import { STORE_LOCAL, STORE_ADDRESS_TEXT, STORE_MAPS_LINK, STORE_MAPS_EMBED_URL } from "../../constants/store";
import styles from "./Location.module.css";

/**
 * Location
 * "Visítanos" + "¿Dudas? Escríbenos por WhatsApp", con la dirección y
 * teléfono reales de la empresa (GET /api/content/company), más un mapa
 * real de Google Maps (iframe embed, sin API key) apuntando a la
 * dirección física del local.
 * El horario de atención no tiene todavía un campo en la base de datos
 * (no forma parte de la tabla "company"), así que por ahora es fijo.
 */
function Location() {
  const { data: company } = useFetch((signal) => contentService.getCompany(signal), []);

  const whatsappNumber = company?.phone?.replace(/\D/g, "");

  return (
    <section className={styles.section}>
      <iframe
        className={styles.map}
        src={STORE_MAPS_EMBED_URL}
        title="Ubicación de Monster Pink en el mapa"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />

      <div className={styles.info}>
        <h3 className={styles.title}>Visítanos en México</h3>

        <p className={styles.line}>
          <MapPin size={16} />
          {company?.address || STORE_ADDRESS_TEXT}
        </p>

        <p className={styles.line}>
          <MapPin size={16} />
          {STORE_LOCAL}
        </p>

        <p className={styles.line}>
          <Clock size={16} />
          Lunes a Domingo: 8:00 am – 6:00 pm
        </p>

        <a href={STORE_MAPS_LINK} target="_blank" rel="noopener noreferrer" className={styles.button}>
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
