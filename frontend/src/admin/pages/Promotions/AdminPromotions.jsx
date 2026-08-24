import { useState } from "react";
import { Tag, CalendarRange, Ticket } from "lucide-react";
import PromotionsTab from "./PromotionsTab";
import SeasonsTab from "./SeasonsTab";
import CouponsTab from "./CouponsTab";
import styles from "./AdminPromotions.module.css";

const TABS = [
  { id: "promotions", label: "Promociones", icon: Tag },
  { id: "seasons", label: "Temporadas", icon: CalendarRange },
  { id: "coupons", label: "Cupones", icon: Ticket },
];

/**
 * AdminPromotions
 * /admin/promociones (RF-038, RF-011, RF-014, RN-035). Administra las tres
 * herramientas de descuento del catálogo: promociones por producto,
 * temporadas comerciales y cupones. Cada una vive en su propia pestaña
 * porque son entidades independientes en el backend (ver
 * modules/promotions/*), pero comparten esta página porque
 * conceptualmente son "cómo se le da un descuento a algo".
 */
function AdminPromotions() {
  const [tab, setTab] = useState("promotions");

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Promociones</h1>

      <div className={styles.tabs}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={`${styles.tabButton} ${tab === id ? styles.tabActive : ""}`}
            onClick={() => setTab(id)}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {tab === "promotions" && <PromotionsTab />}
      {tab === "seasons" && <SeasonsTab />}
      {tab === "coupons" && <CouponsTab />}
    </div>
  );
}

export default AdminPromotions;
