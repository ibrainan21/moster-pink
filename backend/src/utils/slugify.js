// Genera un slug URL-amigable a partir de un texto en español
// (quita acentos, espacios y caracteres especiales).
const slugify = (text) =>
  text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export default slugify;
