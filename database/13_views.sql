USE moster_pink;

DROP VIEW IF EXISTS vw_low_stock_products;
DROP VIEW IF EXISTS vw_financial_summary_daily;
DROP VIEW IF EXISTS vw_ai_recommendations;
DROP VIEW IF EXISTS vw_sales_by_customer;
DROP VIEW IF EXISTS vw_active_promotions;
DROP VIEW IF EXISTS vw_active_seasons;
DROP VIEW IF EXISTS vw_customer_favorites;
DROP VIEW IF EXISTS vw_customers;
DROP VIEW IF EXISTS vw_purchases;
DROP VIEW IF EXISTS vw_orders;
DROP VIEW IF EXISTS vw_inventory;
DROP VIEW IF EXISTS vw_products;

/*=========================================================
=            PRODUCTOS
=========================================================*/

CREATE VIEW vw_products AS
SELECT
    p.id,
    p.name,
    p.sku,
    c.name AS category,
    sc.name AS subcategory,
    s.name AS supplier,
    p.cost,
    p.price,
    p.status,
    p.is_featured,
    p.is_new
FROM products p
INNER JOIN categories c ON p.category_id = c.id
LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
LEFT JOIN suppliers s ON p.supplier_id = s.id
WHERE p.deleted_at IS NULL;


/*=========================================================
=            INVENTARIO
=========================================================*/

CREATE VIEW vw_inventory AS
SELECT
    i.id,
    w.name AS warehouse,
    pr.name AS product,
    v.sku,
    i.stock,
    i.reserved_stock,
    i.available_stock,
    i.min_stock,
    i.max_stock
FROM inventory i
INNER JOIN warehouses w ON i.warehouse_id = w.id
INNER JOIN variants v ON i.product_variant_id = v.id
INNER JOIN products pr ON v.product_id = pr.id;


/*=========================================================
=            PRODUCTOS CON BAJO INVENTARIO (RF-043)
=========================================================*/

CREATE VIEW vw_low_stock_products AS
SELECT
    pr.id AS product_id,
    pr.name AS product,
    v.sku,
    w.name AS warehouse,
    i.stock,
    i.min_stock
FROM inventory i
INNER JOIN variants v ON i.product_variant_id = v.id
INNER JOIN products pr ON v.product_id = pr.id
INNER JOIN warehouses w ON i.warehouse_id = w.id
WHERE i.stock <= i.min_stock;


/*=========================================================
=            PEDIDOS
=========================================================*/

CREATE VIEW vw_orders AS
SELECT
    o.id,
    o.order_number,
    CONCAT(u.first_name,' ',u.last_name) AS customer,
    o.order_date,
    o.status,
    o.subtotal,
    o.discount,
    o.shipping_cost,
    o.tax,
    o.total
FROM orders o
INNER JOIN users u ON o.user_id = u.id;


/*=========================================================
=            COMPRAS
=========================================================*/

CREATE VIEW vw_purchases AS
SELECT
    p.id,
    p.purchase_number,
    s.name AS supplier,
    p.purchase_date,
    p.status,
    p.subtotal,
    p.tax,
    p.total
FROM purchases p
INNER JOIN suppliers s ON p.supplier_id = s.id;


/*=========================================================
=            CLIENTES (usuarios con rol Cliente)
=========================================================*/

CREATE VIEW vw_customers AS
SELECT
    u.id,
    CONCAT(u.first_name,' ',u.last_name) AS customer,
    u.email,
    u.phone,
    u.is_active,
    u.created_at
FROM users u
INNER JOIN roles r ON u.role_id = r.id
WHERE r.name = 'Cliente'
  AND u.deleted_at IS NULL;


/*=========================================================
=            FAVORITOS
=========================================================*/

CREATE VIEW vw_customer_favorites AS
SELECT
    f.id,
    u.id AS customer_id,
    CONCAT(u.first_name,' ',u.last_name) AS customer,
    p.id AS product_id,
    p.name AS product,
    f.created_at
FROM favorites f
INNER JOIN users u ON f.user_id = u.id
INNER JOIN products p ON f.product_id = p.id;


/*=========================================================
=            PROMOCIONES ACTIVAS
=========================================================*/

CREATE VIEW vw_active_promotions AS
SELECT
    id, name, discount_type, discount_value, minimum_purchase, start_date, end_date
FROM promotions
WHERE is_active = TRUE
  AND NOW() BETWEEN start_date AND end_date;


/*=========================================================
=            TEMPORADAS ACTIVAS (RF-011)
=========================================================*/

CREATE VIEW vw_active_seasons AS
SELECT
    id, name, slug, start_date, end_date
FROM seasons
WHERE is_active = TRUE
  AND CURDATE() BETWEEN start_date AND end_date;


/*=========================================================
=            VENTAS POR CLIENTE
=========================================================*/

CREATE VIEW vw_sales_by_customer AS
SELECT
    u.id,
    CONCAT(u.first_name,' ',u.last_name) AS customer,
    COUNT(o.id) AS total_orders,
    COALESCE(SUM(o.total),0) AS total_spent
FROM users u
INNER JOIN roles r ON u.role_id = r.id
LEFT JOIN orders o ON u.id = o.user_id AND o.status <> 'CANCELLED'
WHERE r.name = 'Cliente'
GROUP BY u.id, u.first_name, u.last_name;


/*=========================================================
=            RESUMEN FINANCIERO DIARIO (RF-044.2)
=========================================================*/

CREATE VIEW vw_financial_summary_daily AS
SELECT
    d.summary_date,
    COALESCE(sales.total, 0) AS income,
    COALESCE(exp.total, 0) AS expenses,
    COALESCE(sales.total, 0) - COALESCE(exp.total, 0) AS gross_profit
FROM (
    SELECT DATE(order_date) AS summary_date FROM orders
    UNION
    SELECT expense_date AS summary_date FROM expenses
) d
LEFT JOIN (
    SELECT DATE(order_date) AS summary_date, SUM(total) AS total
    FROM orders
    WHERE status <> 'CANCELLED'
    GROUP BY DATE(order_date)
) sales ON sales.summary_date = d.summary_date
LEFT JOIN (
    SELECT expense_date AS summary_date, SUM(amount) AS total
    FROM expenses
    GROUP BY expense_date
) exp ON exp.summary_date = d.summary_date;


/*=========================================================
=            IA
=========================================================*/

CREATE VIEW vw_ai_recommendations AS
SELECT
    ar.id,
    CONCAT(u.first_name,' ',u.last_name) AS customer,
    p.name AS product,
    ar.score,
    ar.reason,
    ar.was_purchased,
    ar.generated_at
FROM ai_recommendations ar
LEFT JOIN users u ON ar.user_id = u.id
INNER JOIN products p ON ar.product_id = p.id;
