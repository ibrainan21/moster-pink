import styles from "./CategoryCard.module.css";

function CategoryCard({ image, title }) {
  return (
    <div className={styles.card}>

      {image ? (
        <img
          src={image}
          alt={title}
          className={styles.image}
        />
      ) : (
        // Categoría sin imagen cargada todavía en el panel administrativo:
        // mostramos un placeholder en vez de un ícono de imagen rota.
        <div className={styles.imagePlaceholder}>{title.charAt(0)}</div>
      )}

      <h3>{title}</h3>

    </div>
  );
}

export default CategoryCard;