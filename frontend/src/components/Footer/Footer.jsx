import { MessageCircle, Music2, Globe } from "lucide-react";
import { Link } from "react-router-dom";
import useFetch from "../../hooks/useFetch";
import categoryService from "../../services/category.service";
import contentService from "../../services/content.service";
import styles from "./Footer.module.css";

// Ícono según la plataforma guardada en social_links (RF-042). La versión
// instalada de lucide-react (^1.27.0) ya no incluye los logos de marcas
// (Instagram, Facebook, etc. por temas de licencia), así que esas usan el
// ícono genérico "Globe" como respaldo en vez de tronar en tiempo de
// ejecución por intentar renderizar un componente inexistente.
const ICONS = {
  tiktok: Music2,
  whatsapp: MessageCircle,
};

function Footer() {
  const { data: categories } = useFetch(
    (signal) => categoryService.list(true, signal),
    []
  );
  const { data: social } = useFetch((signal) => contentService.listSocial(signal), []);
  const { data: company } = useFetch((signal) => contentService.getCompany(signal), []);

  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.grid}>
        <div>
          <h3 className={styles.brand}>
            Monster<span>Pink</span>
          </h3>
          <p className={styles.tagline}>
            Regalos y detalles que enamoran. Haz sonreír a alguien hoy.
          </p>

          {!!social?.length && (
            <div className={styles.socialIcons}>
              {social.map((link) => {
                const Icon = ICONS[link.platform?.toLowerCase()] || Globe;
                return (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={link.platform}
                  >
                    <Icon size={18} />
                  </a>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <h4 className={styles.heading}>Comprar</h4>
          <ul>
            {(categories || []).slice(0, 5).map((category) => (
              <li key={category.id}>
                <Link to={`/categorias/${category.slug}`}>{category.name}</Link>
              </li>
            ))}
            {!categories?.length && <li>Categorías próximamente</li>}
          </ul>
        </div>

        <div>
          <h4 className={styles.heading}>Ayuda</h4>
          <ul>
            <li><Link to="/preguntas-frecuentes">Preguntas frecuentes</Link></li>
            <li><Link to="/envios">Envíos</Link></li>
            <li><Link to="/cambios-devoluciones">Cambios y devoluciones</Link></li>
            <li><Link to="/seguimiento">Seguimiento de pedido</Link></li>
          </ul>
        </div>

        <div>
          <h4 className={styles.heading}>Contacto</h4>
          <ul>
            {company?.phone && <li>{company.phone}</li>}
            {company?.email && <li>{company.email}</li>}
            {company?.address && <li>{company.address}</li>}
          </ul>
        </div>
      </div>

      <div className={styles.bottom}>
        <p>© {year} {company?.name || "Moster Pink"}. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}

export default Footer;
