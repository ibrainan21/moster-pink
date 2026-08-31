import pool from "../../config/database.js";

class CompanyRepository {
  // "Información pública" del negocio (CU-023). Se maneja como fila única.
  async get() {
    const [rows] = await pool.query(`SELECT * FROM company ORDER BY id ASC LIMIT 1`);
    return rows[0] || null;
  }

  async create({ name, legalName, rfc, phone, email, website, address, logoUrl, about }) {
    const [result] = await pool.query(
      `INSERT INTO company (name, legal_name, rfc, phone, email, website, address, logo_url, about)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, legalName || null, rfc || null, phone || null, email || null, website || null, address || null, logoUrl || null, about || null]
    );
    return this.get();
  }

  async update(id, { name, legalName, rfc, phone, email, website, address, logoUrl, about }) {
    await pool.query(
      `UPDATE company SET
         name = ?, legal_name = ?, rfc = ?, phone = ?, email = ?, website = ?, address = ?, logo_url = ?, about = ?
       WHERE id = ?`,
      [name, legalName || null, rfc || null, phone || null, email || null, website || null, address || null, logoUrl || null, about || null, id]
    );
    return this.get();
  }
}

export default new CompanyRepository();
