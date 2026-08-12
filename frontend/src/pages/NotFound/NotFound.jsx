import { Link } from "react-router-dom";
import Header from "../../components/Header/Header";
import styles from "./NotFound.module.css";

function NotFound() {
  return (
    <div>
      <Header />
      <div className={styles.wrapper}>
        <h1 className={styles.code}>404</h1>
        <p className={styles.message}>No encontramos la página que buscas.</p>
        <Link to="/" className={styles.button}>
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}

export default NotFound;
