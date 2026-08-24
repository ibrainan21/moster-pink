import { useState } from "react";
import { Image, GalleryHorizontalEnd, Share2, Building2 } from "lucide-react";
import BannersTab from "./BannersTab";
import GalleryTab from "./GalleryTab";
import SocialTab from "./SocialTab";
import CompanyTab from "./CompanyTab";
import styles from "./AdminContent.module.css";

const TABS = [
  { id: "banners", label: "Banners", icon: Image },
  { id: "gallery", label: "Galería", icon: GalleryHorizontalEnd },
  { id: "social", label: "Redes sociales", icon: Share2 },
  { id: "company", label: "Empresa", icon: Building2 },
];

/**
 * AdminContent
 * /admin/contenido (RF-039 a RF-042, CU-023). Administra todo el
 * contenido "de vitrina" del sitio: el banner principal y el carrusel del
 * Home, la galería de "Síguenos en Instagram", los enlaces a redes
 * sociales del Footer, y los datos públicos de la empresa (dirección,
 * teléfono, etc. que usa el bloque "Visítanos").
 */
function AdminContent() {
  const [tab, setTab] = useState("banners");

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Contenido del sitio</h1>

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

      {tab === "banners" && <BannersTab />}
      {tab === "gallery" && <GalleryTab />}
      {tab === "social" && <SocialTab />}
      {tab === "company" && <CompanyTab />}
    </div>
  );
}

export default AdminContent;
