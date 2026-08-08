import pool from "../../config/database.js";

class RecommendationRepository {
  // RF-045: recomendador por reglas. Sin modelos de IA reales todavía
  // (RN-046: los modelos nunca modifican datos, solo recomiendan; en esta
  // primera versión el "modelo" es un conjunto de reglas de negocio).
  // Busca productos activos dentro del presupuesto, priorizando los que
  // coincidan con la ocasión (por temporada o etiqueta) y los destacados.
  async findCandidates({ budget, occasion, categoryId }) {
    const conditions = ["p.status = 'ACTIVE'", "p.deleted_at IS NULL"];
    const params = [];

    // Rango de tolerancia sobre el presupuesto (±20%) para no dejar la
    // búsqueda vacía si el presupuesto es muy exacto.
    if (budget) {
      conditions.push("p.price <= ?");
      params.push(Number(budget) * 1.2);
    }

    if (categoryId) {
      conditions.push("p.category_id = ?");
      params.push(categoryId);
    }

    const where = `WHERE ${conditions.join(" AND ")}`;

    // "occasion" intenta casar contra el nombre de una temporada activa o
    // una etiqueta (tag) del producto; si no hay coincidencia, igual regresa
    // candidatos por presupuesto para que el recomendador nunca quede vacío.
    const [rows] = await pool.query(
      `SELECT DISTINCT p.id, p.name, p.slug, p.price, p.is_featured,
              (SELECT image_url FROM product_images pi WHERE pi.product_id = p.id
                 ORDER BY pi.is_main DESC, pi.position ASC LIMIT 1) AS image,
              (
                (CASE WHEN t.name = ? THEN 2 ELSE 0 END) +
                (CASE WHEN s.name = ? THEN 2 ELSE 0 END) +
                (CASE WHEN p.is_featured THEN 1 ELSE 0 END)
              ) AS relevance
       FROM products p
       LEFT JOIN product_tags pt ON pt.product_id = p.id
       LEFT JOIN tags t ON pt.tag_id = t.id
       LEFT JOIN product_seasons pse ON pse.product_id = p.id
       LEFT JOIN seasons s ON s.id = pse.season_id AND s.is_active = TRUE
       ${where}
       ORDER BY relevance DESC, ABS(p.price - ?) ASC
       LIMIT 8`,
      [occasion || "", occasion || "", ...params, Number(budget) || 0]
    );
    return rows;
  }

  // RF-046, RN-045: toda recomendación generada se guarda para el dataset.
  async logRecommendations({ userId, sessionToken, criteria, products }) {
    if (!products.length) return [];

    const reason = JSON.stringify(criteria);
    const values = products.map((p) => [userId || null, p.id, p.relevance || 0, reason]);

    const [result] = await pool.query(
      `INSERT INTO ai_recommendations (user_id, product_id, score, reason) VALUES ?`,
      [values]
    );

    // Guardamos también la sesión anónima (si la hay) en una tabla ligera de
    // seguimiento a través de search_logs, para no requerir user_id.
    if (!userId && sessionToken) {
      await pool.query(
        `INSERT INTO search_logs (session_token, query, results_count)
         VALUES (?, ?, ?)`,
        [sessionToken, `[recomendador] ${reason}`, products.length]
      );
    }

    return { insertedCount: result.affectedRows };
  }

  // Se llama (de forma no bloqueante) cuando un pedido se crea, para marcar
  // si el cliente terminó comprando algo que le habíamos recomendado antes.
  async markRecommendationsAsPurchased(userId, productIds) {
    if (!userId || !productIds.length) return;
    await pool.query(
      `UPDATE ai_recommendations
       SET was_purchased = TRUE
       WHERE user_id = ? AND product_id IN (?)`,
      [userId, productIds]
    );
  }

  async listByUser(userId) {
    const [rows] = await pool.query(
      `SELECT ar.*, p.name AS product_name, p.slug, p.price
       FROM ai_recommendations ar
       INNER JOIN products p ON ar.product_id = p.id
       WHERE ar.user_id = ?
       ORDER BY ar.generated_at DESC`,
      [userId]
    );
    return rows;
  }

  // Panel administrativo: qué tanto se está usando el recomendador y qué
  // tan bien está funcionando (para RF-047 / futuras versiones con IA real).
  async getStats() {
    const [[totals]] = await pool.query(
      `SELECT COUNT(*) AS total_recommendations,
              SUM(was_purchased) AS total_converted
       FROM ai_recommendations`
    );

    const [topProducts] = await pool.query(
      `SELECT p.id, p.name, COUNT(*) AS times_recommended,
              SUM(ar.was_purchased) AS times_purchased
       FROM ai_recommendations ar
       INNER JOIN products p ON ar.product_id = p.id
       GROUP BY p.id, p.name
       ORDER BY times_recommended DESC
       LIMIT 10`
    );

    return {
      totalRecommendations: totals.total_recommendations,
      totalConverted: totals.total_converted || 0,
      conversionRate: totals.total_recommendations
        ? ((totals.total_converted / totals.total_recommendations) * 100).toFixed(1)
        : "0.0",
      topProducts,
    };
  }
}

export default new RecommendationRepository();
