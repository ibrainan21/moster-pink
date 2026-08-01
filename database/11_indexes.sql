USE moster_pink;

/* ==========================================================
   USERS
========================================================== */

CREATE INDEX idx_users_role ON users(role_id);
-- (email ya tiene índice implícito por la restricción UNIQUE)

/* ==========================================================
   PRODUCTS
========================================================== */

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_subcategory ON products(subcategory_id);
CREATE INDEX idx_products_supplier ON products(supplier_id);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_status ON products(status);

/* ==========================================================
   VARIANTS
========================================================== */

CREATE INDEX idx_variants_product ON variants(product_id);
-- (sku ya tiene índice implícito por la restricción UNIQUE)

/* ==========================================================
   IMAGES / COMBOS / RELATED PRODUCTS
========================================================== */

CREATE INDEX idx_product_images_product ON product_images(product_id);
CREATE INDEX idx_product_images_variant ON product_images(product_variant_id);
CREATE INDEX idx_combo_items_combo ON combo_items(combo_id);
CREATE INDEX idx_related_products_related ON related_products(related_product_id);

/* ==========================================================
   INVENTORY
========================================================== */

CREATE INDEX idx_inventory_variant ON inventory(product_variant_id);
CREATE INDEX idx_inventory_warehouse ON inventory(warehouse_id);
CREATE INDEX idx_inventory_movements_inventory_date
    ON inventory_movements(inventory_id, created_at);

/* ==========================================================
   PURCHASES
========================================================== */

CREATE INDEX idx_purchases_supplier ON purchases(supplier_id);
CREATE INDEX idx_purchases_date ON purchases(purchase_date);
CREATE INDEX idx_purchase_details_purchase ON purchase_details(purchase_id);
CREATE INDEX idx_purchase_details_variant ON purchase_details(variant_id);

/* ==========================================================
   CUSTOMER-FACING (direcciones, favoritos, reseñas, carrito)
========================================================== */

CREATE INDEX idx_customer_addresses_user ON customer_addresses(user_id);
CREATE INDEX idx_favorites_user_product ON favorites(user_id, product_id);
CREATE INDEX idx_reviews_product ON reviews(product_id);
CREATE INDEX idx_cart_items_user ON cart_items(user_id);

/* ==========================================================
   ORDERS
========================================================== */

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_date ON orders(order_date);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_details_order ON order_details(order_id);
CREATE INDEX idx_order_details_variant ON order_details(variant_id);

/* ==========================================================
   PROMOTIONS / SEASONS
========================================================== */

CREATE INDEX idx_promotions_dates ON promotions(start_date, end_date);
CREATE INDEX idx_seasons_dates ON seasons(start_date, end_date);
-- (coupons.code ya tiene índice implícito por la restricción UNIQUE)

/* ==========================================================
   FINANCES
========================================================== */

CREATE INDEX idx_cash_movements_date ON cash_movements(created_at);
CREATE INDEX idx_expenses_date ON expenses(expense_date);
CREATE INDEX idx_expenses_category ON expenses(category_id);
CREATE INDEX idx_income_date ON income(income_date);
CREATE INDEX idx_financial_transactions_type ON financial_transactions(transaction_type);

/* ==========================================================
   AI
========================================================== */

CREATE INDEX idx_ai_conversations_user ON ai_conversations(user_id);
CREATE INDEX idx_ai_messages_conversation ON ai_messages(conversation_id);
CREATE INDEX idx_ai_recommendations_user ON ai_recommendations(user_id);
CREATE INDEX idx_ai_predictions_type ON ai_predictions(prediction_type);
CREATE INDEX idx_ai_prompt_history_model ON ai_prompt_history(model_id);
CREATE INDEX idx_product_views_product ON product_views(product_id);
CREATE INDEX idx_product_views_user ON product_views(user_id);
CREATE INDEX idx_search_logs_user ON search_logs(user_id);

/* ==========================================================
   AUDIT
========================================================== */

CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_date ON audit_log(created_at);
