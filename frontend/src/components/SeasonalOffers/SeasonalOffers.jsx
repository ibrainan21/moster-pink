import { Link } from "react-router-dom";
import useFetch from "../../hooks/useFetch";
import promotionService from "../../services/promotion.service";
import styles from "./SeasonalOffers.module.css";

/**
 * SeasonalOffers
 * Sección "Ofertas de temporada" (RF-011, RF-014). Muestra las temporadas
 * que estén activas en este momento (San Valentín, Navidad, etc.); tu base
 * de datos ya las activa/desactiva sola según la fecha (evento programado
 * ev_toggle_seasons), así que esta sección aparece y desaparece del Home
 * automáticamente sin que nadie tenga que tocar código.
 */
function SeasonalOffers() {
  const { data: seasons, loading } = useFetch(
    (signal) => promotionService.listSeasons(true, signal),
    []
  );

  // Si no hay temporadas activas ahora mismo, la sección completa se oculta
  // en vez de mostrar un bloque vacío o un mensaje de error.
  if (loading || !seasons?.length) return null;

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>Ofertas de temporada</h2>
        <Link to="/temporadas" className={styles.viewAll}>
          Ver todos →
        </Link>
      </div>

      <div className={styles.grid}>
        {seasons.map((season) => (
          <div
            key={season.id}
            className={styles.card}
            style={
              season.banner_image
                ? { backgroundImage: `url(${season.banner_image})` }
                : undefined
            }
          >
            <div className={styles.cardContent}>
              <h3 className={styles.cardTitle}>{season.name}</h3>
              <Link to={`/temporadas/${season.slug}`} className={styles.cardButton}>
                Comprar ahora
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default SeasonalOffers;
