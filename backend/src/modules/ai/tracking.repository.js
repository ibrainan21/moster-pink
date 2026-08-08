import pool from "../../config/database.js";

class TrackingRepository {
  // RF-047: registrar productos consultados y tiempo de navegación.
  async logProductView({ productId, userId, sessionToken, durationSeconds }) {
    await pool.query(
      `INSERT INTO product_views (product_id, user_id, session_token, duration_seconds)
       VALUES (?, ?, ?, ?)`,
      [productId, userId || null, sessionToken || null, durationSeconds || null]
    );
  }

  // RF-047: registrar búsquedas realizadas.
  async logSearch({ userId, sessionToken, query, resultsCount }) {
    await pool.query(
      `INSERT INTO search_logs (user_id, session_token, query, results_count)
       VALUES (?, ?, ?, ?)`,
      [userId || null, sessionToken || null, query, resultsCount || 0]
    );
  }

  async getMostViewedProducts(limit = 10) {
    const [rows] = await pool.query(
      `SELECT p.id, p.name, COUNT(*) AS views
       FROM product_views pv
       INNER JOIN products p ON pv.product_id = p.id
       GROUP BY p.id, p.name
       ORDER BY views DESC
       LIMIT ?`,
      [Number(limit)]
    );
    return rows;
  }

  async getTopSearches(limit = 10) {
    const [rows] = await pool.query(
      `SELECT query, COUNT(*) AS times_searched, AVG(results_count) AS avg_results
       FROM search_logs
       GROUP BY query
       ORDER BY times_searched DESC
       LIMIT ?`,
      [Number(limit)]
    );
    return rows;
  }

  async getDatasetSummary() {
    const [[views]] = await pool.query(`SELECT COUNT(*) AS total FROM product_views`);
    const [[searches]] = await pool.query(`SELECT COUNT(*) AS total FROM search_logs`);
    const [[recommendations]] = await pool.query(`SELECT COUNT(*) AS total FROM ai_recommendations`);

    return {
      productViews: views.total,
      searches: searches.total,
      recommendations: recommendations.total,
    };
  }
}

export default new TrackingRepository();
