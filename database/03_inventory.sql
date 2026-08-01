USE moster_pink;

-- =====================================================
-- TABLA: warehouses
-- =====================================================

CREATE TABLE warehouses (

    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL,
    address TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,

    CONSTRAINT uq_warehouse_code UNIQUE (code)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: inventory (RF-017, RN-016)
-- available_stock nunca es negativo porque RN-016 se aplica
-- desde la aplicación/triggers antes de descontar stock.
-- =====================================================

CREATE TABLE inventory (

    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    warehouse_id BIGINT UNSIGNED NOT NULL,
    product_variant_id BIGINT UNSIGNED NOT NULL,

    stock INT NOT NULL DEFAULT 0,
    reserved_stock INT NOT NULL DEFAULT 0,
    available_stock INT
        GENERATED ALWAYS AS (stock - reserved_stock) STORED,

    min_stock INT NOT NULL DEFAULT 0,
    max_stock INT,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_inventory_warehouse
        FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
    CONSTRAINT fk_inventory_variant
        FOREIGN KEY (product_variant_id) REFERENCES variants(id),
    CONSTRAINT uq_inventory UNIQUE (warehouse_id, product_variant_id),
    CONSTRAINT chk_inventory_stock_non_negative CHECK (stock >= 0)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: movement_types
-- =====================================================

CREATE TABLE movement_types (

    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(30) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    affects_stock BOOLEAN NOT NULL DEFAULT TRUE,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_movement_type_code UNIQUE (code)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO movement_types
(code, name, description, affects_stock)
VALUES
('PURCHASE',        'Compra',                  'Entrada por compra a proveedor', TRUE),
('SALE',            'Venta',                   'Salida por venta al cliente', TRUE),
('PURCHASE_RETURN', 'Devolución a proveedor',  'Salida por devolución al proveedor', TRUE),
('SALE_RETURN',     'Devolución de cliente',   'Entrada por devolución de cliente en buen estado', TRUE),
('DAMAGED_RETURN',  'Devolución dañada',       'Devolución de cliente que no regresa al inventario', FALSE),
('ADJUSTMENT_IN',   'Ajuste positivo',         'Incremento manual de inventario', TRUE),
('ADJUSTMENT_OUT',  'Ajuste negativo',         'Disminución manual de inventario', TRUE),
('TRANSFER_IN',     'Transferencia recibida',  'Entrada desde otro almacén', TRUE),
('TRANSFER_OUT',    'Transferencia enviada',   'Salida hacia otro almacén', TRUE),
('CANCELLATION',    'Cancelación de pedido',   'Entrada por cancelación de pedido antes del envío', TRUE),
('INITIAL_STOCK',   'Inventario inicial',      'Carga inicial de inventario', TRUE);

-- =====================================================
-- TABLA: inventory_movements (RF-019, RF-020, RN-015, RN-022)
-- =====================================================

CREATE TABLE inventory_movements (

    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    inventory_id BIGINT UNSIGNED NOT NULL,
    movement_type_id BIGINT UNSIGNED NOT NULL,

    quantity INT NOT NULL,
    reference_type VARCHAR(50),
    reference_id BIGINT UNSIGNED,
    notes TEXT,
    created_by BIGINT UNSIGNED NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_inventory_movements_inventory
        FOREIGN KEY (inventory_id) REFERENCES inventory(id),
    CONSTRAINT fk_inventory_movements_type
        FOREIGN KEY (movement_type_id) REFERENCES movement_types(id),
    CONSTRAINT fk_inventory_movements_user
        FOREIGN KEY (created_by) REFERENCES users(id)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: stock_adjustments / adjustment_details
-- =====================================================

CREATE TABLE stock_adjustments (

    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    warehouse_id BIGINT UNSIGNED NOT NULL,
    reason VARCHAR(255) NOT NULL,
    created_by BIGINT UNSIGNED NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_stock_adjustments_warehouse
        FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
    CONSTRAINT fk_stock_adjustments_user
        FOREIGN KEY (created_by) REFERENCES users(id)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE adjustment_details (

    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    stock_adjustment_id BIGINT UNSIGNED NOT NULL,
    inventory_id BIGINT UNSIGNED NOT NULL,
    adjustment_type ENUM('IN','OUT') NOT NULL,
    quantity INT NOT NULL,
    notes TEXT,

    CONSTRAINT fk_adjustment_details_adjustment
        FOREIGN KEY (stock_adjustment_id) REFERENCES stock_adjustments(id),
    CONSTRAINT fk_adjustment_details_inventory
        FOREIGN KEY (inventory_id) REFERENCES inventory(id),
    CONSTRAINT chk_adjustment_details_quantity CHECK (quantity > 0)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: inventory_alerts (RF-021, RF-022, RN-021)
-- =====================================================

CREATE TABLE inventory_alerts (

    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    inventory_id BIGINT UNSIGNED NOT NULL,
    warehouse_id BIGINT UNSIGNED NOT NULL,
    alert_type ENUM('LOW_STOCK','OUT_OF_STOCK','OVERSTOCK') NOT NULL,
    message VARCHAR(255),
    is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
    resolved_at DATETIME NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_inventory_alert_inventory
        FOREIGN KEY (inventory_id) REFERENCES inventory(id),
    CONSTRAINT fk_inventory_alert_warehouse
        FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLAS: restock_lists / restock_list_items (RF-024)
-- "Lista para surtir": productos que el administrador marca
-- para comprar próximamente, consultable desde PC o celular.
-- =====================================================

CREATE TABLE restock_lists (

    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL DEFAULT 'Lista para surtir',
    status ENUM('OPEN','ORDERED','CLOSED') NOT NULL DEFAULT 'OPEN',
    created_by BIGINT UNSIGNED NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_restock_lists_user
        FOREIGN KEY (created_by) REFERENCES users(id)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE restock_list_items (

    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    restock_list_id BIGINT UNSIGNED NOT NULL,
    variant_id BIGINT UNSIGNED NOT NULL,
    requested_quantity INT NOT NULL DEFAULT 1,
    notes VARCHAR(255),

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_restock_list_items_list
        FOREIGN KEY (restock_list_id) REFERENCES restock_lists(id),
    CONSTRAINT fk_restock_list_items_variant
        FOREIGN KEY (variant_id) REFERENCES variants(id),
    CONSTRAINT uq_restock_list_item UNIQUE (restock_list_id, variant_id)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
