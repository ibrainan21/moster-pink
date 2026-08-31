import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import contentService from "../../services/content.service";
import styles from "./ImageUploadField.module.css";

/**
 * ImageUploadField
 * Campo controlado con dos formas de obtener una URL de imagen:
 *  A) pegarla manualmente, o
 *  B) seleccionar un archivo de la computadora, que se sube a Cloudinary
 *     mediante POST /api/content/upload-image (contentService.uploadImage)
 *     y cuya URL resultante se entrega igual que si se hubiera pegado.
 *
 * Es un componente "tonto": no sabe nada del formulario donde vive, solo
 * recibe `value` (la URL actual) y llama `onChange(nuevaUrl)` cuando cambia,
 * ya sea por texto o por subida. Así se puede usar igual en Categorías,
 * Banners, Galería, "Conócenos" o el logo de la empresa.
 *
 * Formatos aceptados: los mismos que ya valida el backend (JPG, PNG, WEBP,
 * GIF, hasta 5MB) — SVG no está habilitado a propósito.
 */
function ImageUploadField({ value, onChange, label = "Imagen", previewClassName, autoFocus }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setUploading(true);
    try {
      const result = await contentService.uploadImage(file);
      onChange(result.imageUrl);
    } catch (err) {
      setError(err.message || "No pudimos subir la imagen.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className={styles.field}>
      <label>{label}</label>

      <div className={styles.row}>
        <input
          type="text"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Pega una URL de imagen..."
          autoFocus={autoFocus}
        />

        <label className={styles.uploadButton}>
          <Upload size={14} />
          {uploading ? "Subiendo..." : "Subir archivo"}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileChange}
            disabled={uploading}
            hidden
          />
        </label>
      </div>

      {error && <p className={styles.error}>{error}</p>}
      {value && <img src={value} alt="" className={previewClassName || styles.preview} />}
    </div>
  );
}

export default ImageUploadField;
