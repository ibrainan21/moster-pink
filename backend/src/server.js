import app from "./app.js";

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 Moster Pink API iniciada correctamente.");
  console.log(`🌐 Servidor ejecutándose en http://localhost:${PORT}`);
});