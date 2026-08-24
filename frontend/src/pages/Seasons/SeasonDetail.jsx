import { useParams, useNavigate, Link } from "react-router-dom";
import ProductCard from "../../components/ProductCard/ProductCard";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import useFetch from "../../hooks/useFetch";
import promotionService from "../../services/promotion.service";
import styles from "./SeasonDetail.module.css";

/**
 * SeasonDetail
 * /temporadas/:slug (RF-011). El backend de temporadas trabaja con id, no
 * con slug (ver promotion.routes.js: GET /seasons/:id), así que primero
 * traemos todas las temporadas para resolver el id a partir del slug de la
 * URL, igual que hace Products.jsx con categorías.
 */
function SeasonDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const { data: seasons, loading: loadingList } = useFetch(
    (signal) => promotionService.listSeasons(false, signal),
    []
  );

  const seasonSummary = seasons?.find((s) => s.slug === slug);

  const { data: season, loading: loadingSeason, error } = useFetch(
    (signal) =>
      seasonSummary ? promotionService.getSeason(seasonSummary.id, signal) : Promise.resolve(null),
    [seasonSummary?.id]
  );

  const loading = loadingList || (seasonSummary && loadingSeason);

  return (
    <div>
      <Header />

      <div className={styles.page}>
        {loading && <p className={styles.state}>Cargando temporada...</p>}

        {!loading && (error || (!seasonSummary && seasons)) && (
          <div className={styles.notFound}>
            <p>No encontramos esta temporada.</p>
            <Link to="/temporadas" className={styles.backLink}>
              ← Ver todas las temporadas
            </Link>
          </div>
        )}

        {!loading && season && (
          <>
            <div
              className={styles.banner}
              style={season.banner_image ? { backgroundImage: `url(${season.banner_image})` } : undefined}
            >
              <div className={styles.bannerContent}>
                <h1 className={styles.title}>{season.name}</h1>
                {season.description && <p className={styles.description}>{season.description}</p>}
              </div>
            </div>

            {season.products?.length === 0 && (
              <p className={styles.state}>Todavía no hay productos en esta colección.</p>
            )}

            {season.products?.length > 0 && (
              <div className={styles.grid}>
                {season.products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={{ ...product, main_image: product.image }}
                    onClick={() => navigate(`/productos/${product.slug}`)}
                    onAddToCart={() => navigate(`/productos/${product.slug}`)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}

export default SeasonDetail;
