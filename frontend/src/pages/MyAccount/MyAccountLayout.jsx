import { Outlet } from "react-router-dom";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import { useAuth } from "../../context/AuthContext";
import MyAccountSidebar from "./MyAccountSidebar";
import styles from "./MyAccountLayout.module.css";

/**
 * MyAccountLayout
 * Layout de /mi-cuenta/* (ver AppRouter.jsx): mantiene el Header/Footer de
 * la tienda pública (a diferencia del panel /admin, que sí es un shell
 * aparte) y agrega una barra lateral de navegación entre las secciones de
 * la cuenta. Cada sección se renderiza en <Outlet />.
 */
function MyAccountLayout() {
  const { user } = useAuth();

  return (
    <div>
      <Header />

      <div className={styles.page}>
        <div className={styles.intro}>
          <h1 className={styles.title}>Mi cuenta</h1>
          <p className={styles.subtitle}>
            Hola, {user?.first_name}. Aquí puedes ver tus pedidos, direcciones, favoritos y más.
          </p>
        </div>

        <div className={styles.layout}>
          <MyAccountSidebar />
          <div className={styles.content}>
            <Outlet />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default MyAccountLayout;
