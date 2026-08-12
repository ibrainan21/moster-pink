import { Link, NavLink, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import styles from "./Header.module.css";
import logo from "../../assets/images/logo/logo.png";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";

import {
  Heart,
  ShoppingCart,
  User,
  Search,
  Menu,
  Phone,
  Truck,
  LogOut
} from "lucide-react";

// isActive lo da NavLink automáticamente: le pone la clase "active" al
// link cuya ruta coincide con la URL actual (para el subrayado rosa).
const navLinkClass = ({ isActive }) =>
  isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink;

function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const { cart, ensureLoaded } = useCart();
  const navigate = useNavigate();

  // Carga el carrito una vez que sabemos que hay sesión, para que el
  // número en el ícono ya esté listo sin que el usuario tenga que abrir
  // /carrito primero.
  useEffect(() => {
    if (isAuthenticated) ensureLoaded();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <>
      <div className={styles.topBar}>
        <div className={styles.topLeft}>
          <Truck size={16} />
          <span>Envíos a todo México</span>
        </div>

        <div className={styles.topRight}>
          <Phone size={16} />
          <span>WhatsApp</span>
        </div>
      </div>

      <header className={styles.header}>

        <Link to="/" className={styles.logo}>

          <img
            src={logo}
            alt="Monster Pink"
            className={styles.logoImage}
          />

          <div className={styles.logoText}>
            <h1>Monster Pink</h1>
            <p>Regalos & Detalles</p>
          </div>

        </Link>

        <nav className={styles.nav}>
          <NavLink to="/" end className={navLinkClass}>Inicio</NavLink>
          <NavLink to="/productos" className={navLinkClass}>Productos</NavLink>
          <NavLink to="/personalizados" className={navLinkClass}>Personalizados</NavLink>
          <NavLink to="/temporadas" className={navLinkClass}>Temporadas</NavLink>
          <NavLink to="/contacto" className={navLinkClass}>Contacto</NavLink>
        </nav>

        <div className={styles.actions}>

          <div className={styles.search}>
            <Search size={18}/>
            <input
              type="text"
              placeholder="Buscar..."
            />
          </div>

          <Link to="/favoritos" aria-label="Favoritos">
            <Heart className={styles.icon}/>
          </Link>
          <Link to="/carrito" aria-label="Carrito" className={styles.cartLink}>
            <ShoppingCart className={styles.icon}/>
            {cart.itemCount > 0 && (
              <span className={styles.cartBadge}>{cart.itemCount}</span>
            )}
          </Link>

          {isAuthenticated ? (
            <div className={styles.userMenu}>
              <Link to="/mi-cuenta" className={styles.userLink} aria-label="Mi cuenta">
                <User className={styles.icon}/>
                <span className={styles.userName}>{user.first_name}</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className={styles.logoutButton}
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <Link to="/login" aria-label="Iniciar sesión">
              <User className={styles.icon}/>
            </Link>
          )}

          <button className={styles.menuButton} aria-label="Menú">
            <Menu size={24}/>
          </button>

        </div>

      </header>
    </>
  );
}

export default Header;
