import { Sparkles, MapPin } from "lucide-react";
import useFetch from "../../hooks/useFetch";
import contentService from "../../services/content.service";
import { STORE_LOCAL, STORE_ADDRESS_TEXT } from "../../constants/store";
import styles from "./AboutUs.module.css";

/**
 * AboutUs ("Conócenos")
 * Va debajo de Location en el Home. La descripción sale de company.about
 * (administrable en el panel, pestaña "Empresa"); si todavía no se ha
 * escrito ninguna, no inventamos texto — simplemente no se muestra el
 * párrafo. Las fotos salen de la galería ya existente
 * (GET /api/content/gallery?category=conocenos), administrable desde la
 * pestaña "Galería" del panel usando category = "conocenos".
 */
function AboutUs() {
  const { data: company } = useFetch((signal) => contentService.getCompany(signal), []);
  const { data: photos } = useFetch(
    (signal) => contentService.listGallery(signal, "conocenos"),
    []
  );

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>
        <Sparkles size={22} color="#ff5c93" />
        Conócenos
      </h2>

      {company?.about && <p className={styles.about}>{company.about}</p>}

      <p className={styles.line}>
        <MapPin size={16} />
        {STORE_LOCAL} — {company?.address || STORE_ADDRESS_TEXT}
      </p>

      {photos?.length > 0 && (
        <div className={styles.gallery}>
          {photos.map((photo) => (
            <div key={photo.id} className={styles.photoCard}>
              <img src={photo.image_url} alt={photo.title || "Monster Pink"} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default AboutUs;
