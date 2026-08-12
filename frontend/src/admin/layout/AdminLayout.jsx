import { Outlet, Link } from "react-router-dom";
import { LogOut, Store } from "lucide-react";
import AdminSidebar from "./AdminSidebar";
import { useAuth } from "../../context/AuthContext";
import styles from "./AdminLayout.module.css";

/**
 * AdminLayout
 * Layout independiente del panel /admin (no reutiliza el Header/Footer de
 * la tienda pública, para que se sienta claramente distinto — sidebar fijo
 * a la izquierda + topbar con el usuario actual). Las páginas de cada
 * sección se renderizan en <Outlet /> (ver AppRouter.jsx).
 */
function AdminLayout() {
  const { user, logout } = useAuth();

  return (
    <div className={styles.shell}>
      <AdminSidebar />

      <div className={styles.main}>
        <header className={styles.topbar}>
          <Link to="/" className={styles.storeLink}>
            <Store size={16} /> Ver tienda
          </Link>

          <div className={styles.userInfo}>
            <span className={styles.userName}>
              {user?.first_name} {user?.last_name}
            </span>
            <span className={styles.userRole}>{user?.role_name}</span>
            <button type="button" className={styles.logoutButton} onClick={logout}>
              <LogOut size={16} />
            </button>
          </div>
        </header>

        <div className={styles.content}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default AdminLayout;
