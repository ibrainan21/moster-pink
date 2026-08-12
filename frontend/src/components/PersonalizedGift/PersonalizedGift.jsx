import { Gift } from "lucide-react";
import { Link } from "react-router-dom";
import styles from "./PersonalizedGift.module.css";

/**
 * PersonalizedGift
 * "Personaliza tu regalo": bloque promocional fijo (no depende de datos del
 * backend, es contenido de marketing igual que en el diseño original).
 */
function PersonalizedGift() {
  return (
    <section className={styles.section}>
      <div className={styles.text}>
        <h2 className={styles.title}>
          Personaliza tu regalo <Gift size={22} />
        </h2>
        <p className={styles.subtitle}>
          Crea un detalle único combinando flores, peluches, chocolates, globos y más.
        </p>
        <Link to="/personalizados" className={styles.button}>
          Personalizar regalo
        </Link>
      </div>

      <ul className={styles.options}>
        <li>Flores</li>
        <li>Peluches</li>
        <li>Chocolates</li>
        <li>Globos</li>
        <li>Accesorios</li>
      </ul>
    </section>
  );
}

export default PersonalizedGift;
