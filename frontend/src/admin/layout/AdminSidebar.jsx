import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Warehouse,
  FolderTree,
  ShoppingBag,
  Users,
  Star,
  Tag,
  Image,
  Settings,
} from "lucide-react";
import styles from "./AdminSidebar.module.css";

// Cada entrada mapea 1:1 a un módulo con backend real (ver conversación:
// inventario de endpoints). "comingSoon: true" son secciones que todavía
// no tienen endpoint propio y se construyen en una fase posterior.
const NAV_ITEMS = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/productos", label: "Productos", icon: Package },
  { to: "/admin/inventario", label: "Inventario", icon: Warehouse },
  { to: "/admin/categorias", label: "Categorías", icon: FolderTree },
  { to: "/admin/pedidos", label: "Pedidos", icon: ShoppingBag },
  { to: "/admin/usuarios", label: "Usuarios", icon: Users },
  { to: "/admin/resenas", label: "Reseñas", icon: Star },
  { to: "/admin/promociones", label: "Temporadas / Promos", icon: Tag },
  { to: "/admin/contenido", label: "Banners / Contenido", icon: Image },
  { to: "/admin/configuracion", label: "Configuración", icon: Settings },
];

function AdminSidebar() {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <span className={styles.brandDot} />
        Moster Pink <span className={styles.brandTag}>Admin</span>
      </div>

      <nav className={styles.nav}>
        {NAV_ITEMS.map(({ to, label, icon: Icon, end, comingSoon }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `${styles.link} ${isActive ? styles.linkActive : ""}`
            }
          >
            <Icon size={18} />
            <span>{label}</span>
            {comingSoon && <span className={styles.badge}>Próx.</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default AdminSidebar;
