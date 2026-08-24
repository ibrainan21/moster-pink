import pool from "../../config/database.js";

// system_settings (09_settings.sql) es una tabla genérica clave/valor
// (setting_key único). Este repositorio no le impone un esquema fijo: el
// que decide qué claves existen es SettingsService.KNOWN_SETTINGS.
class SettingsRepository {
  async getAll() {
    const [rows] = await pool.query(`SELECT setting_key, setting_value FROM system_settings`);
    const map = {};
    for (const row of rows) {
      map[row.setting_key] = row.setting_value;
    }
    return map;
  }

  async get(key) {
    const [rows] = await pool.query(
      `SELECT setting_value FROM system_settings WHERE setting_key = ? LIMIT 1`,
      [key]
    );
    return rows[0]?.setting_value ?? null;
  }

  // Upsert: si la clave ya existe la actualiza, si no la crea. Así el
  // admin no necesita "inicializar" cada configuración por separado.
  async set(key, value, description, updatedBy) {
    await pool.query(
      `INSERT INTO system_settings (setting_key, setting_value, description, updated_by)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_by = VALUES(updated_by)`,
      [key, String(value), description || null, updatedBy || null]
    );
  }
}

export default new SettingsRepository();
