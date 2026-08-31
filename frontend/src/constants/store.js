// Datos fijos del local físico de Monster Pink. Se usan en Location,
// FAQ y la sección "Conócenos" para no repetir el texto en tres archivos.
export const STORE_LOCAL = "Local 627 - 628";

export const STORE_ADDRESS_TEXT =
  "Guillermo Prieto 45, Jamaica, Venustiano Carranza, 15800 Ciudad de México, CDMX";

// Enlace corto ya generado desde Google Maps para esta ubicación exacta.
export const STORE_MAPS_LINK = "https://maps.app.goo.gl/i5h4kyzBbNqHW2PK8";

// URL de embed pública (sin API key) para mostrar el mapa dentro de un
// iframe. Usa la dirección de texto como búsqueda.
export const STORE_MAPS_EMBED_URL = `https://www.google.com/maps?q=${encodeURIComponent(
  STORE_ADDRESS_TEXT + " " + STORE_LOCAL
)}&output=embed`;
