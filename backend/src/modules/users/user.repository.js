import pool from "../../config/database.js";

class UserRepository {
  // Usado por el middleware de autenticación y por "mi perfil".
  async findById(id) {
    const [rows] = await pool.query(
      `SELECT u.*, r.name AS role_name
       FROM users u
       INNER JOIN roles r ON u.role_id = r.id
       WHERE u.id = ? AND u.deleted_at IS NULL
       LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  }

  // Usado en login (RF-002) y registro (RF-001, RN-001: un correo = una cuenta).
  async findByEmail(email) {
    const [rows] = await pool.query(
      `SELECT u.*, r.name AS role_name
       FROM users u
       INNER JOIN roles r ON u.role_id = r.id
       WHERE u.email = ? AND u.deleted_at IS NULL
       LIMIT 1`,
      [email]
    );
    return rows[0] || null;
  }

  async findRoleByName(roleName) {
    const [rows] = await pool.query(
      `SELECT id, name FROM roles WHERE name = ? LIMIT 1`,
      [roleName]
    );
    return rows[0] || null;
  }

  async create({ roleId, firstName, lastName, email, passwordHash, phone = null }) {
    const [result] = await pool.query(
      `INSERT INTO users (role_id, first_name, last_name, email, password, phone)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [roleId, firstName, lastName, email, passwordHash, phone]
    );
    return this.findById(result.insertId);
  }

  async updateLastLogin(id) {
    await pool.query(`UPDATE users SET last_login = NOW() WHERE id = ?`, [id]);
  }

  async updateProfile(id, { firstName, lastName, phone, profilePhoto }) {
    await pool.query(
      `UPDATE users
       SET first_name = ?, last_name = ?, phone = ?, profile_photo = COALESCE(?, profile_photo)
       WHERE id = ?`,
      [firstName, lastName, phone, profilePhoto, id]
    );
    return this.findById(id);
  }

  async updatePassword(id, passwordHash) {
    await pool.query(`UPDATE users SET password = ? WHERE id = ?`, [passwordHash, id]);
  }

  // RF-004: administración de usuarios (listar, bloquear, activar, cambiar rol).
  async list({ page = 1, limit = 20, roleName = null, isActive = null, search = null }) {
    const offset = (page - 1) * limit;
    const conditions = ["u.deleted_at IS NULL"];
    const params = [];

    if (roleName) {
      conditions.push("r.name = ?");
      params.push(roleName);
    }

    if (isActive !== null) {
      conditions.push("u.is_active = ?");
      params.push(isActive ? 1 : 0);
    }

    if (search) {
      conditions.push("(u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?)");
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const [rows] = await pool.query(
      `SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.is_active,
              u.last_login, u.created_at, r.name AS role_name
       FROM users u
       INNER JOIN roles r ON u.role_id = r.id
       ${whereClause}
       ORDER BY u.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, Number(limit), Number(offset)]
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total
       FROM users u
       INNER JOIN roles r ON u.role_id = r.id
       ${whereClause}`,
      params
    );

    return { rows, total, page: Number(page), limit: Number(limit) };
  }

  async setActive(id, isActive) {
    await pool.query(`UPDATE users SET is_active = ? WHERE id = ?`, [isActive ? 1 : 0, id]);
    return this.findById(id);
  }

  async updateRole(id, roleId) {
    await pool.query(`UPDATE users SET role_id = ? WHERE id = ?`, [roleId, id]);
    return this.findById(id);
  }

  // RF-003: recuperación de contraseña.
  async createPasswordReset(userId, code, expiresAt) {
    await pool.query(
      `INSERT INTO password_resets (user_id, code, expires_at) VALUES (?, ?, ?)`,
      [userId, code, expiresAt]
    );
  }

  async findValidPasswordReset(userId, code) {
    const [rows] = await pool.query(
      `SELECT * FROM password_resets
       WHERE user_id = ? AND code = ? AND used_at IS NULL AND expires_at > NOW()
       ORDER BY id DESC LIMIT 1`,
      [userId, code]
    );
    return rows[0] || null;
  }

  async markPasswordResetUsed(id) {
    await pool.query(`UPDATE password_resets SET used_at = NOW() WHERE id = ?`, [id]);
  }
}

export default new UserRepository();
