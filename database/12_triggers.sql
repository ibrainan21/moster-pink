USE moster_pink;

DELIMITER $$

-- =====================================================
-- LIMPIEZA
-- =====================================================

DROP TRIGGER IF EXISTS trg_purchase_details_ai$$
DROP TRIGGER IF EXISTS trg_order_details_bi$$
DROP TRIGGER IF EXISTS trg_order_details_ai$$
DROP TRIGGER IF EXISTS trg_purchase_return_details_ai$$
DROP TRIGGER IF EXISTS trg_adjustment_details_ai$$
DROP TRIGGER IF EXISTS trg_orders_bu$$
DROP TRIGGER IF EXISTS trg_order_return_details_ai$$

DROP PROCEDURE IF EXISTS sp_check_inventory_alert$$
DROP PROCEDURE IF EXISTS sp_restore_inventory_for_order$$

-- =====================================================
-- PROCEDIMIENTO
-- ACTUALIZAR ALERTAS DE INVENTARIO (RF-021, RF-022)
-- =====================================================

CREATE PROCEDURE sp_check_inventory_alert
(
    IN p_inventory_id BIGINT UNSIGNED
)
BEGIN

    DECLARE v_stock INT;
    DECLARE v_min INT;
    DECLARE v_max INT;
    DECLARE v_warehouse BIGINT UNSIGNED;

    SELECT stock, min_stock, max_stock, warehouse_id
    INTO v_stock, v_min, v_max, v_warehouse
    FROM inventory
    WHERE id = p_inventory_id;

    UPDATE inventory_alerts
    SET is_resolved = TRUE, resolved_at = NOW()
    WHERE inventory_id = p_inventory_id
      AND is_resolved = FALSE;

    IF v_stock = 0 THEN

        INSERT INTO inventory_alerts (inventory_id, warehouse_id, alert_type, message)
        VALUES (p_inventory_id, v_warehouse, 'OUT_OF_STOCK', 'Producto agotado.');

    ELSEIF v_stock <= v_min THEN

        INSERT INTO inventory_alerts (inventory_id, warehouse_id, alert_type, message)
        VALUES (p_inventory_id, v_warehouse, 'LOW_STOCK', 'Inventario por debajo del mínimo.');

    ELSEIF v_max IS NOT NULL AND v_stock >= v_max THEN

        INSERT INTO inventory_alerts (inventory_id, warehouse_id, alert_type, message)
        VALUES (p_inventory_id, v_warehouse, 'OVERSTOCK', 'Inventario por encima del máximo.');

    END IF;

END$$

-- =====================================================
-- COMPRAS
-- ENTRADA AUTOMÁTICA DE INVENTARIO (RF-027, RN-018, RN-023)
-- Solo corre cuando la compra pasa a status = RECEIVED, no en
-- cualquier INSERT de purchase_details (una compra PENDING no
-- debe mover inventario todavía).
-- =====================================================

CREATE TRIGGER trg_purchase_details_ai
AFTER INSERT ON purchase_details
FOR EACH ROW
BEGIN

    DECLARE v_inventory_id BIGINT UNSIGNED;
    DECLARE v_movement_type BIGINT UNSIGNED;
    DECLARE v_status VARCHAR(20);

    SELECT status INTO v_status
    FROM purchases
    WHERE id = NEW.purchase_id;

    IF v_status = 'RECEIVED' THEN

        SELECT id INTO v_inventory_id
        FROM inventory
        WHERE warehouse_id = NEW.warehouse_id
          AND product_variant_id = NEW.variant_id
        LIMIT 1;

        IF v_inventory_id IS NULL THEN

            INSERT INTO inventory (warehouse_id, product_variant_id, stock)
            VALUES (NEW.warehouse_id, NEW.variant_id, NEW.quantity);

            SET v_inventory_id = LAST_INSERT_ID();

        ELSE

            UPDATE inventory
            SET stock = stock + NEW.quantity
            WHERE id = v_inventory_id;

        END IF;

        SELECT id INTO v_movement_type
        FROM movement_types WHERE code = 'PURCHASE' LIMIT 1;

        INSERT INTO inventory_movements
            (inventory_id, movement_type_id, quantity, reference_type, reference_id, notes)
        VALUES
            (v_inventory_id, v_movement_type, NEW.quantity, 'PURCHASE', NEW.purchase_id,
             'Entrada automática por compra');

        CALL sp_check_inventory_alert(v_inventory_id);

    END IF;

END$$

-- =====================================================
-- COMPRAS
-- ENTRADA AUTOMÁTICA CUANDO UNA COMPRA CAMBIA A "RECIBIDA"
-- (cubre el caso normal: primero se capturan los detalles con
-- la compra en PENDING, y después se marca como RECEIVED).
-- =====================================================

DROP TRIGGER IF EXISTS trg_purchases_received_bu$$

CREATE TRIGGER trg_purchases_received_bu
BEFORE UPDATE ON purchases
FOR EACH ROW
BEGIN

    IF NEW.status = 'RECEIVED' AND OLD.status <> 'RECEIVED' THEN
        SET NEW.received_at = IFNULL(NEW.received_at, NOW());
    END IF;

END$$

DROP TRIGGER IF EXISTS trg_purchases_received_au$$

CREATE TRIGGER trg_purchases_received_au
AFTER UPDATE ON purchases
FOR EACH ROW
BEGIN

    DECLARE done INT DEFAULT FALSE;
    DECLARE v_warehouse_id BIGINT UNSIGNED;
    DECLARE v_variant_id BIGINT UNSIGNED;
    DECLARE v_quantity INT;
    DECLARE v_inventory_id BIGINT UNSIGNED;
    DECLARE v_movement_type BIGINT UNSIGNED;

    DECLARE cur CURSOR FOR
        SELECT warehouse_id, variant_id, quantity
        FROM purchase_details
        WHERE purchase_id = NEW.id;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    IF NEW.status = 'RECEIVED' AND OLD.status <> 'RECEIVED' THEN

        SELECT id INTO v_movement_type
        FROM movement_types WHERE code = 'PURCHASE' LIMIT 1;

        OPEN cur;

        read_loop: LOOP

            FETCH cur INTO v_warehouse_id, v_variant_id, v_quantity;
            IF done THEN
                LEAVE read_loop;
            END IF;

            SELECT id INTO v_inventory_id
            FROM inventory
            WHERE warehouse_id = v_warehouse_id
              AND product_variant_id = v_variant_id
            LIMIT 1;

            IF v_inventory_id IS NULL THEN

                INSERT INTO inventory (warehouse_id, product_variant_id, stock)
                VALUES (v_warehouse_id, v_variant_id, v_quantity);

                SET v_inventory_id = LAST_INSERT_ID();

            ELSE

                UPDATE inventory
                SET stock = stock + v_quantity
                WHERE id = v_inventory_id;

            END IF;

            INSERT INTO inventory_movements
                (inventory_id, movement_type_id, quantity, reference_type, reference_id, notes)
            VALUES
                (v_inventory_id, v_movement_type, v_quantity, 'PURCHASE', NEW.id,
                 'Entrada automática al recibir la compra');

            CALL sp_check_inventory_alert(v_inventory_id);

        END LOOP;

        CLOSE cur;

    END IF;

END$$

-- =====================================================
-- VALIDAR STOCK ANTES DE LA VENTA (RN-016, RN-017)
-- =====================================================

CREATE TRIGGER trg_order_details_bi
BEFORE INSERT ON order_details
FOR EACH ROW
BEGIN

    DECLARE v_stock INT;

    SELECT stock INTO v_stock
    FROM inventory
    WHERE warehouse_id = NEW.warehouse_id
      AND product_variant_id = NEW.variant_id
    LIMIT 1;

    IF v_stock IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'No existe inventario para esta variante en el almacén seleccionado.';
    END IF;

    IF v_stock < NEW.quantity THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Stock insuficiente para completar la venta.';
    END IF;

END$$

-- =====================================================
-- VENTAS
-- SALIDA AUTOMÁTICA DE INVENTARIO (RN-017)
-- =====================================================

CREATE TRIGGER trg_order_details_ai
AFTER INSERT ON order_details
FOR EACH ROW
BEGIN

    DECLARE v_inventory_id BIGINT UNSIGNED;
    DECLARE v_movement_type BIGINT UNSIGNED;

    SELECT id INTO v_inventory_id
    FROM inventory
    WHERE warehouse_id = NEW.warehouse_id
      AND product_variant_id = NEW.variant_id
    LIMIT 1;

    UPDATE inventory
    SET stock = stock - NEW.quantity
    WHERE id = v_inventory_id;

    SELECT id INTO v_movement_type
    FROM movement_types WHERE code = 'SALE' LIMIT 1;

    INSERT INTO inventory_movements
        (inventory_id, movement_type_id, quantity, reference_type, reference_id, notes)
    VALUES
        (v_inventory_id, v_movement_type, NEW.quantity, 'SALE', NEW.order_id,
         'Salida automática por venta');

    CALL sp_check_inventory_alert(v_inventory_id);

END$$

-- =====================================================
-- CANCELACIÓN DE PEDIDOS (RF-033, RN-019)
-- Si un pedido pasa a CANCELLED y todavía no había sido
-- enviado ni entregado, se restaura el inventario de todos
-- sus renglones automáticamente.
-- =====================================================

CREATE TRIGGER trg_orders_bu
BEFORE UPDATE ON orders
FOR EACH ROW
BEGIN

    DECLARE done INT DEFAULT FALSE;
    DECLARE v_warehouse_id BIGINT UNSIGNED;
    DECLARE v_variant_id BIGINT UNSIGNED;
    DECLARE v_quantity INT;
    DECLARE v_inventory_id BIGINT UNSIGNED;
    DECLARE v_movement_type BIGINT UNSIGNED;

    DECLARE cur CURSOR FOR
        SELECT warehouse_id, variant_id, quantity
        FROM order_details
        WHERE order_id = NEW.id;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    -- RN-028: no se permiten saltos de estado incompatibles
    -- (ejemplo del SRS: Pendiente -> Entregado directo).
    IF OLD.status = 'PENDING' AND NEW.status IN ('SHIPPED','DELIVERED') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Transición de estado no permitida para el pedido.';
    END IF;

    IF OLD.status NOT IN ('SHIPPED','DELIVERED','CANCELLED')
       AND NEW.status = 'CANCELLED' THEN

        SELECT id INTO v_movement_type
        FROM movement_types WHERE code = 'CANCELLATION' LIMIT 1;

        OPEN cur;

        cancel_loop: LOOP

            FETCH cur INTO v_warehouse_id, v_variant_id, v_quantity;
            IF done THEN
                LEAVE cancel_loop;
            END IF;

            SELECT id INTO v_inventory_id
            FROM inventory
            WHERE warehouse_id = v_warehouse_id
              AND product_variant_id = v_variant_id
            LIMIT 1;

            IF v_inventory_id IS NOT NULL THEN

                UPDATE inventory
                SET stock = stock + v_quantity
                WHERE id = v_inventory_id;

                INSERT INTO inventory_movements
                    (inventory_id, movement_type_id, quantity, reference_type, reference_id, notes)
                VALUES
                    (v_inventory_id, v_movement_type, v_quantity, 'ORDER_CANCELLED', NEW.id,
                     'Restauración automática por cancelación de pedido');

                CALL sp_check_inventory_alert(v_inventory_id);

            END IF;

        END LOOP;

        CLOSE cur;

    END IF;

END$$

-- =====================================================
-- HISTORIAL DE ESTADOS DE PEDIDO (RN-029)
-- =====================================================

DROP TRIGGER IF EXISTS trg_orders_status_history_au$$

CREATE TRIGGER trg_orders_status_history_au
AFTER UPDATE ON orders
FOR EACH ROW
BEGIN

    IF NEW.status <> OLD.status THEN

        INSERT INTO order_status_history
            (order_id, previous_status, new_status, changed_by, notes)
        VALUES
            (NEW.id, OLD.status, NEW.status, IFNULL(NEW.created_by, NEW.user_id),
             'Cambio automático de estado');

    END IF;

END$$

-- =====================================================
-- DEVOLUCIONES A PROVEEDOR
-- SALIDA AUTOMÁTICA DE INVENTARIO
-- =====================================================

CREATE TRIGGER trg_purchase_return_details_ai
AFTER INSERT ON purchase_return_details
FOR EACH ROW
BEGIN

    DECLARE v_inventory_id BIGINT UNSIGNED;
    DECLARE v_stock INT;
    DECLARE v_movement_type BIGINT UNSIGNED;

    SELECT id, stock INTO v_inventory_id, v_stock
    FROM inventory
    WHERE warehouse_id = NEW.warehouse_id
      AND product_variant_id = NEW.variant_id
    LIMIT 1;

    IF v_inventory_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'No existe inventario para registrar la devolución.';
    END IF;

    IF v_stock < NEW.quantity THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'No hay suficiente inventario para devolver al proveedor.';
    END IF;

    UPDATE inventory
    SET stock = stock - NEW.quantity
    WHERE id = v_inventory_id;

    SELECT id INTO v_movement_type
    FROM movement_types WHERE code = 'PURCHASE_RETURN' LIMIT 1;

    INSERT INTO inventory_movements
        (inventory_id, movement_type_id, quantity, reference_type, reference_id, notes)
    VALUES
        (v_inventory_id, v_movement_type, NEW.quantity, 'PURCHASE_RETURN', NEW.purchase_return_id,
         'Salida automática por devolución al proveedor');

    CALL sp_check_inventory_alert(v_inventory_id);

END$$

-- =====================================================
-- DEVOLUCIONES DE CLIENTE (RF-034, RN-020)
-- Si el producto está en buen estado, regresa al inventario.
-- Si está dañado, solo se registra el movimiento (sin afectar
-- stock) para trazabilidad.
-- =====================================================

CREATE TRIGGER trg_order_return_details_ai
AFTER INSERT ON order_return_details
FOR EACH ROW
BEGIN

    DECLARE v_inventory_id BIGINT UNSIGNED;
    DECLARE v_movement_type BIGINT UNSIGNED;

    SELECT id INTO v_inventory_id
    FROM inventory
    WHERE warehouse_id = NEW.warehouse_id
      AND product_variant_id = NEW.variant_id
    LIMIT 1;

    IF NEW.item_condition = 'GOOD' THEN

        SELECT id INTO v_movement_type
        FROM movement_types WHERE code = 'SALE_RETURN' LIMIT 1;

        IF v_inventory_id IS NOT NULL THEN
            UPDATE inventory
            SET stock = stock + NEW.quantity
            WHERE id = v_inventory_id;
        END IF;

    ELSE

        SELECT id INTO v_movement_type
        FROM movement_types WHERE code = 'DAMAGED_RETURN' LIMIT 1;

    END IF;

    IF v_inventory_id IS NOT NULL THEN

        INSERT INTO inventory_movements
            (inventory_id, movement_type_id, quantity, reference_type, reference_id, notes)
        VALUES
            (v_inventory_id, v_movement_type, NEW.quantity, 'ORDER_RETURN', NEW.order_return_id,
             CONCAT('Devolución de cliente - condición: ', NEW.item_condition));

        CALL sp_check_inventory_alert(v_inventory_id);

    END IF;

END$$

-- =====================================================
-- AJUSTES MANUALES DE INVENTARIO
-- =====================================================

CREATE TRIGGER trg_adjustment_details_ai
AFTER INSERT ON adjustment_details
FOR EACH ROW
BEGIN

    DECLARE v_movement_type BIGINT UNSIGNED;

    IF NEW.adjustment_type = 'IN' THEN

        UPDATE inventory SET stock = stock + NEW.quantity WHERE id = NEW.inventory_id;

        SELECT id INTO v_movement_type
        FROM movement_types WHERE code = 'ADJUSTMENT_IN' LIMIT 1;

    ELSE

        UPDATE inventory SET stock = stock - NEW.quantity WHERE id = NEW.inventory_id;

        SELECT id INTO v_movement_type
        FROM movement_types WHERE code = 'ADJUSTMENT_OUT' LIMIT 1;

    END IF;

    INSERT INTO inventory_movements
        (inventory_id, movement_type_id, quantity, reference_type, reference_id, notes)
    VALUES
        (NEW.inventory_id, v_movement_type, NEW.quantity, 'ADJUSTMENT',
         NEW.stock_adjustment_id, NEW.notes);

    CALL sp_check_inventory_alert(NEW.inventory_id);

END$$

DELIMITER ;

-- =====================================================
-- EVENTOS PROGRAMADOS (CU-034, CU-035, RF-010, RF-014)
-- Requieren que el event scheduler de MySQL esté activo:
--   SET GLOBAL event_scheduler = ON;
-- =====================================================

DROP EVENT IF EXISTS ev_clear_new_products;
DROP EVENT IF EXISTS ev_publish_scheduled_products;
DROP EVENT IF EXISTS ev_unpublish_scheduled_products;
DROP EVENT IF EXISTS ev_toggle_seasons;

DELIMITER $$

-- RF-010: quitar la etiqueta "Nuevo" cuando vence el periodo.
CREATE EVENT ev_clear_new_products
ON SCHEDULE EVERY 1 HOUR
DO
BEGIN
    UPDATE products
    SET is_new = FALSE
    WHERE is_new = TRUE
      AND new_until IS NOT NULL
      AND new_until <= NOW();
END$$

-- RF-014: publicar productos programados.
CREATE EVENT ev_publish_scheduled_products
ON SCHEDULE EVERY 1 HOUR
DO
BEGIN
    UPDATE products
    SET status = 'ACTIVE'
    WHERE status = 'INACTIVE'
      AND published_at IS NOT NULL
      AND published_at <= NOW()
      AND (unpublish_at IS NULL OR unpublish_at > NOW());
END$$

-- RF-014: despublicar productos al finalizar campaña/temporada.
CREATE EVENT ev_unpublish_scheduled_products
ON SCHEDULE EVERY 1 HOUR
DO
BEGIN
    UPDATE products
    SET status = 'INACTIVE'
    WHERE status = 'ACTIVE'
      AND unpublish_at IS NOT NULL
      AND unpublish_at <= NOW();
END$$

-- CU-035: activar/desactivar temporadas según su rango de fechas.
CREATE EVENT ev_toggle_seasons
ON SCHEDULE EVERY 1 DAY
DO
BEGIN
    UPDATE seasons
    SET is_active = TRUE
    WHERE CURDATE() BETWEEN start_date AND end_date
      AND is_active = FALSE;

    UPDATE seasons
    SET is_active = FALSE
    WHERE CURDATE() NOT BETWEEN start_date AND end_date
      AND is_active = TRUE;
END$$

DELIMITER ;
