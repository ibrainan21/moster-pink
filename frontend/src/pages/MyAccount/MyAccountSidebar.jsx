import { NavLink, useNavigate } from "react-router-dom";
import { User, Package, MapPin, Heart, Star, LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import styles from "./MyAccountSidebar.module.css";

const NAV_ITEMS = [
  { to: "/mi-cuenta/perfil", label: "Mi perfil", icon: User },
  { to: "/mi-cuenta/pedidos", label: "Mis pedidos", icon: Package },
  { to: "/mi-cuenta/direcciones", label: "Direcciones", icon: MapPin },
  { to: "/mi-cuenta/favoritos", label: "Favoritos", icon: Heart },
  { to: "/mi-cuenta/resenas", label: "Mis opiniones", icon: Star },
];

function MyAccountSidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <aside className={styles.sidebar}>
      <nav className={styles.nav}>
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `${styles.link} ${isActive ? styles.linkActive : ""}`}
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}

        <button type="button" className={styles.logoutButton} onClick={handleLogout}>
          <LogOut size={18} />
          <span>Cerrar sesión</span>
        </button>
      </nav>
    </aside>
  );
}

export default MyAccountSidebar;
