import multer from "multer";

// Guardamos el archivo en memoria y lo subimos nosotros a Cloudinary desde el
// servicio (no usamos multer-storage-cloudinary para no atar el middleware a
// un solo destino: así el mismo middleware sirve para imágenes de producto,
// banners, galería, avatar, etc.).
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error("Formato de imagen no permitido. Usa JPG, PNG, WEBP o GIF."));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

export default upload;