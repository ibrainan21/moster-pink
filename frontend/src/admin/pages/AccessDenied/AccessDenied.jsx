import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import styles from "./AccessDenied.module.css";

function AccessDenied() {
  return (
    <div className={styles.page}>
      <ShieldAlert size={56} color="#ff5c93" />
      <h1>Acceso denegado</h1>
      <p>Tu cuenta no tiene permisos de Administrador para ver esta sección.</p>
      <Link to="/" className={styles.link}>
        ← Volver a la tienda
      </Link>
    </div>
  );
}

export default AccessDenied;
