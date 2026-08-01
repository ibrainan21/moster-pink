import cloudinary from "../config/cloudinary.js";

// Sube un buffer (req.file.buffer, viene de multer.memoryStorage) a Cloudinary
// y regresa la URL segura para guardar en la base de datos (image_url).
export const uploadBufferToCloudinary = (buffer, folder = "moster-pink") =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
