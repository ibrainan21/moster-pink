import SettingsRepository from "./settings.repository.js";

// Catálogo de configuraciones que el sitio realmente usa. No es un
// editor de claves libres: el admin edita estos campos conocidos, con
// nombre amigable y tipo, para que la pantalla de Configuración no sea
// una tabla clave/valor cruda sin contexto.
export const KNOWN_SETTINGS = {
  shipping_cost: {
    label: "Costo de envío estándar",
    description: "Se cobra en cada pedido, salvo que llegue al envío gratis.",
    type: "number",
    default: "0",
  },
  free_shipping_threshold: {
    label: "Envío gratis a partir de",
    description: "Si el subtotal del pedido llega a este monto, el envío es gratis. Pon 0 para desactivarlo.",
    type: "number",
    default: "0",
  },
  tax_rate: {
    label: "Tasa de impuesto (%)",
    description: "Porcentaje que se aplica al subtotal de cada pedido.",
    type: "number",
    default: "0",
  },
  low_stock_notify_email: {
    label: "Correo para alertas de stock bajo",
    description: "A dónde avisar cuando un producto llega a su stock mínimo (informativo por ahora).",
    type: "text",
    default: "",
  },
};

class SettingsService {
  // Para la pantalla de administración: todas las claves conocidas, con
  // su valor guardado o su default si el admin nunca la ha tocado.
  async getAll() {
    const saved = await SettingsRepository.getAll();
    const result = {};
    for (const [key, meta] of Object.entries(KNOWN_SETTINGS)) {
      result[key] = saved[key] ?? meta.default;
    }
    return result;
  }

  async update(values, updatedBy) {
    const entries = Object.entries(values).filter(([key]) => key in KNOWN_SETTINGS);
    await Promise.all(
      entries.map(([key, value]) =>
        SettingsRepository.set(key, value, KNOWN_SETTINGS[key].description, updatedBy)
      )
    );
    return this.getAll();
  }

  // Atajo tipado para OrderService: evita que cada consumidor tenga que
  // sabe qué claves existen y parsear strings a número por su cuenta.
  async getShippingAndTaxConfig() {
    const saved = await SettingsRepository.getAll();
    return {
      shippingCost: Number(saved.shipping_cost ?? KNOWN_SETTINGS.shipping_cost.default),
      freeShippingThreshold: Number(
        saved.free_shipping_threshold ?? KNOWN_SETTINGS.free_shipping_threshold.default
      ),
      taxRate: Number(saved.tax_rate ?? KNOWN_SETTINGS.tax_rate.default),
    };
  }
}

export default new SettingsService();
