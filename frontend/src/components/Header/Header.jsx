import styles from "./Header.module.css";
import logo from "../../assets/images/logo/logo.png";

import {
  Heart,
  ShoppingCart,
  User,
  Search,
  Menu,
  Phone,
  Truck
} from "lucide-react";

function Header() {
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

        <div className={styles.logo}>

          <img
            src={logo}
            alt="Monster Pink"
            className={styles.logoImage}
          />

          <div className={styles.logoText}>
            <h1>Monster Pink</h1>
            <p>Regalos & Detalles</p>
          </div>

        </div>

        <nav className={styles.nav}>
          <a href="/">Inicio</a>
          <a href="/">Productos</a>
          <a href="/">Personalizados</a>
          <a href="/">Temporadas</a>
          <a href="/">Contacto</a>
        </nav>

        <div className={styles.actions}>

          <div className={styles.search}>
            <Search size={18}/>
            <input
              type="text"
              placeholder="Buscar..."
            />
          </div>

          <Heart className={styles.icon}/>
          <ShoppingCart className={styles.icon}/>
          <User className={styles.icon}/>

          <button className={styles.menuButton}>
            <Menu size={24}/>
          </button>

        </div>

      </header>
    </>
  );
}

export default Header;