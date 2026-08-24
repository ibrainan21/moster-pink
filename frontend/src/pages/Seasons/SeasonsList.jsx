import { Link } from "react-router-dom";
import { CalendarRange } from "lucide-react";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import useFetch from "../../hooks/useFetch";
import promotionService from "../../services/promotion.service";
import styles from "./Seasons.module.css";

const formatDateRange = (start, end) => {
  const opts = { day: "numeric", month: "long" };
  return `${new Date(start).toLocaleDateString("es-MX", opts)} – ${new Date(end).toLocaleDateString(
    "es-MX",
    opts
  )}`;
};

/**
 * SeasonsList
 * /temporadas (RF-011, RF-014). Muestra TODAS las temporadas activas ahora
 * mismo (no solo la que aparece destacada en el Home vía SeasonalOffers).
 */
function SeasonsList() {
  const { data: seasons, loading, error } = useFetch(
    (signal) => promotionService.listSeasons(true, signal),
    []
  );

  return (
    <div>
      <Header />

      <div className={styles.page}>
        <h1 className={styles.title}>Temporadas</h1>
        <p className={styles.subtitle}>Colecciones especiales disponibles por tiempo limitado.</p>

        {loading && <p className={styles.state}>Cargando temporadas...</p>}
        {error && <p className={styles.state}>No pudimos cargar las temporadas.</p>}

        {!loading && !error && seasons?.length === 0 && (
          <div className={styles.empty}>
            <CalendarRange size={40} color="#ff5c93" />
            <p>No hay temporadas activas en este momento. Vuelve pronto.</p>
          </div>
        )}

        {seasons?.length > 0 && (
          <div className={styles.grid}>
            {seasons.map((season) => (
              <Link
                key={season.id}
                to={`/temporadas/${season.slug}`}
                className={styles.card}
                style={
                  season.banner_image ? { backgroundImage: `url(${season.banner_image})` } : undefined
                }
              >
                <div className={styles.cardContent}>
                  <h2 className={styles.cardTitle}>{season.name}</h2>
                  <p className={styles.cardDates}>
                    {formatDateRange(season.start_date, season.end_date)}
                  </p>
                  <span className={styles.cardButton}>Ver colección</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

export default SeasonsList;
