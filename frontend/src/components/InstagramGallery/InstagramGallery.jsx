import { Camera } from "lucide-react";
import useFetch from "../../hooks/useFetch";
import contentService from "../../services/content.service";
import styles from "./InstagramGallery.module.css";

/**
 * InstagramGallery
 * "Síguenos en Instagram" (RF-041), conectado a la galería real que se
 * administra desde el panel de contenido (GET /api/content/gallery).
 */
function InstagramGallery() {
  const { data: images, loading } = useFetch(
    (signal) => contentService.listGallery(signal),
    []
  );

  if (loading || !images?.length) return null;

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>
        <Camera size={22} color="#ff5c93" />
        Síguenos en Instagram
      </h2>

      <div className={styles.grid}>
        {images.slice(0, 6).map((image) => (
          <div key={image.id} className={styles.item}>
            <img src={image.image_url} alt={image.title || "Moster Pink"} />
          </div>
        ))}
      </div>
    </section>
  );
}

export default InstagramGallery;
