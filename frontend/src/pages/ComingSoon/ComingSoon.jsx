import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import Header from "../../components/Header/Header";
import styles from "./ComingSoon.module.css";

/**
 * ComingSoon
 * Página de respaldo honesta para rutas que ya existen en la navegación
 * (Header, Footer, botones del Home) pero cuyo contenido real todavía no
 * se construye. Evita dos problemas peores: una pantalla en blanco al
 * navegar, o inventar contenido falso solo para "rellenar" la página.
 */
function ComingSoon({ title = "Esta sección" }) {
  return (
    <div>
      <Header />
      <div className={styles.wrapper}>
        <Sparkles size={40} color="#ff5c93" />
        <h1 className={styles.title}>{title} está en construcción</h1>
        <p className={styles.subtitle}>
          Estamos trabajando para traerte esta página muy pronto.
        </p>
        <Link to="/" className={styles.button}>
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}

export default ComingSoon;
