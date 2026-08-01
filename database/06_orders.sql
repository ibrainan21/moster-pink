USE moster_pink;

-- =====================================================
-- TABLA: orders (RF-030, RF-031, RN-026, RN-027, RN-028)
-- user_id: cliente dueño del pedido (rol Cliente en "users").
-- created_by: quien capturó el pedido cuando es asistido por
-- un administrador/empleado (venta en mostrador); NULL cuando
-- el propio cliente hace el checkout.
-- =====================================================

CREATE TABLE orders (

    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    address_id BIGINT UNSIGNED NULL,

    order_number VARCHAR(50) NOT NULL,
    order_date DATETIME NOT NULL,

    status ENUM(
        'PENDING','PAID','PREPARING','SHIPPED','DELIVERED','CANCELLED'
    ) NOT NULL DEFAULT 'PENDING',

    subtotal DECIMAL(10,2) NOT NULL,
    discount DECIMAL(10,2) NOT NULL DEFAULT 0,
    shipping_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
    tax DECIMAL(10,2) NOT NULL DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    notes TEXT,

    created_by BIGINT UNSIGNED NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,

    CONSTRAINT fk_orders_user
        FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_orders_address
        FOREIGN KEY (address_id) REFERENCES customer_addresses(id),
    CONSTRAINT fk_orders_created_by
        FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT uq_orders_number UNIQUE (order_number)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ahora que "orders" existe, se completa la FK pendiente de "reviews"
-- (RN-031: una opinión por pedido/producto).
ALTER TABLE reviews
    ADD CONSTRAINT fk_reviews_order
        FOREIGN KEY (order_id) REFERENCES orders(id);

-- =====================================================
-- TABLA: order_details (RF-013 combos vía variant_id normal)
-- =====================================================

CREATE TABLE order_details (

    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT UNSIGNED NOT NULL,
    warehouse_id BIGINT UNSIGNED NOT NULL,
    variant_id BIGINT UNSIGNED NOT NULL,

    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    discount DECIMAL(10,2) NOT NULL DEFAULT 0,
    subtotal DECIMAL(10,2) NOT NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_order_details_order
        FOREIGN KEY (order_id) REFERENCES orders(id),
    CONSTRAINT fk_order_details_warehouse
        FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
    CONSTRAINT fk_order_details_variant
        FOREIGN KEY (variant_id) REFERENCES variants(id),
    CONSTRAINT chk_order_details_quantity CHECK (quantity > 0)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: order_payments (RF-030 Mercado Pago)
-- =====================================================

CREATE TABLE order_payments (

    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT UNSIGNED NOT NULL,

    payment_method ENUM('CASH','CARD','TRANSFER','PAYPAL','MERCADO_PAGO') NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_date DATETIME NOT NULL,
    reference VARCHAR(100),

    status ENUM('PENDING','COMPLETED','FAILED','REFUNDED') NOT NULL DEFAULT 'PENDING',

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_order_payments_order
        FOREIGN KEY (order_id) REFERENCES orders(id)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: shipments
-- =====================================================

CREATE TABLE shipments (

    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT UNSIGNED NOT NULL,

    carrier VARCHAR(100),
    tracking_number VARCHAR(100),
    shipping_status ENUM(
        'PENDING','SHIPPED','IN_TRANSIT','DELIVERED','RETURNED'
    ) NOT NULL DEFAULT 'PENDING',
    shipped_at DATETIME,
    delivered_at DATETIME,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_shipments_order
        FOREIGN KEY (order_id) REFERENCES orders(id)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: order_status_history (RF-031, RN-029)
-- =====================================================

CREATE TABLE order_status_history (

    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT UNSIGNED NOT NULL,

    previous_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by BIGINT UNSIGNED NOT NULL,
    notes TEXT,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_order_status_order
        FOREIGN KEY (order_id) REFERENCES orders(id),
    CONSTRAINT fk_order_status_user
        FOREIGN KEY (changed_by) REFERENCES users(id)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLAS: order_returns / order_return_details (RF-034, RN-020)
-- Devoluciones hechas por el CLIENTE (distintas de
-- purchase_returns, que son devoluciones AL proveedor).
-- Si condition = GOOD, el trigger regresa el producto al
-- inventario; si es DAMAGED, se registra pero no se reincorpora.
-- =====================================================

CREATE TABLE order_returns (

    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT UNSIGNED NOT NULL,

    reason TEXT NOT NULL,
    status ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
    created_by BIGINT UNSIGNED NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_order_returns_order
        FOREIGN KEY (order_id) REFERENCES orders(id),
    CONSTRAINT fk_order_returns_user
        FOREIGN KEY (created_by) REFERENCES users(id)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE order_return_details (

    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_return_id BIGINT UNSIGNED NOT NULL,
    warehouse_id BIGINT UNSIGNED NOT NULL,
    variant_id BIGINT UNSIGNED NOT NULL,

    quantity INT NOT NULL,
    item_condition ENUM('GOOD','DAMAGED') NOT NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_order_return_details_return
        FOREIGN KEY (order_return_id) REFERENCES order_returns(id),
    CONSTRAINT fk_order_return_details_warehouse
        FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
    CONSTRAINT fk_order_return_details_variant
        FOREIGN KEY (variant_id) REFERENCES variants(id),
    CONSTRAINT chk_order_return_details_quantity CHECK (quantity > 0)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
