import { Heart, ShoppingBag } from "lucide-react";
import useFetch from "../../hooks/useFetch";
import contentService from "../../services/content.service";
import styles from "./Hero.module.css";
import fallbackBanner from "../../assets/images/banners/monster-pink-banner.jpeg";

/**
 * Hero
 * Banner principal del Home (RF-039). Se administra desde el panel
 * administrativo: GET /api/content/banners?type=MAIN_BANNER&onlyActive=true.
 * "banners" solo tiene título + imagen + enlace (no subtítulo), así que el
 * texto de apoyo y los botones son fijos; lo único dinámico es la imagen,
 * el título y a dónde lleva el botón principal.
 * Si el administrador todavía no configuró ningún banner, se muestra un
 * contenido de respaldo para que el Home nunca se vea vacío.
 */
function Hero() {
  const { data: banners } = useFetch(
    (signal) => contentService.listBanners("MAIN_BANNER", signal),
    []
  );

  const banner = banners?.[0];
  const image = banner?.image_url || fallbackBanner;
  const title = banner?.title || "Haz sonreír a alguien hoy";
  const buttonLink = banner?.link_url || "/productos";

  return (
    <section className={styles.hero}>
      <div className={styles.imagePanel}>
        <img src={image} alt={title} className={styles.banner} />
      </div>

      <div className={styles.textPanel}>
        <span className={styles.badge}>
          <Heart size={14} fill="#ff5c93" color="#ff5c93" />
          Regalos que enamoran
        </span>

        <h1 className={styles.title}>{title}</h1>

        <p className={styles.subtitle}>
          Regalos únicos para cada ocasión. Flores, peluches, detalles y más.
        </p>

        <div className={styles.actions}>
          <a href={buttonLink} className={styles.primaryButton}>
            <ShoppingBag size={18} />
            Comprar ahora
          </a>
          <a href="/productos" className={styles.secondaryButton}>
            Explorar catálogo
          </a>
        </div>
      </div>
    </section>
  );
}

export default Hero;
