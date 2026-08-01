USE moster_pink;

-- =====================================================
-- TABLA: purchases (RF-025, RF-026, RF-027, RN-023)
-- El inventario solo se actualiza cuando status = RECEIVED
-- (ver trigger en 12_triggers.sql).
-- =====================================================

CREATE TABLE purchases (

    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    supplier_id BIGINT UNSIGNED NOT NULL,
    purchase_number VARCHAR(50) NOT NULL,
    purchase_date DATETIME NOT NULL,

    status ENUM('PENDING','RECEIVED','CANCELLED') NOT NULL DEFAULT 'PENDING',

    subtotal DECIMAL(10,2) NOT NULL,
    tax DECIMAL(10,2) NOT NULL DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    notes TEXT,

    received_at DATETIME NULL,
    received_by BIGINT UNSIGNED NULL,

    created_by BIGINT UNSIGNED NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,

    CONSTRAINT fk_purchases_supplier
        FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    CONSTRAINT fk_purchases_user
        FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT fk_purchases_received_by
        FOREIGN KEY (received_by) REFERENCES users(id),
    CONSTRAINT uq_purchase_number UNIQUE (purchase_number)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: purchase_details (RF-028.1 historial de costos)
-- =====================================================

CREATE TABLE purchase_details (

    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    purchase_id BIGINT UNSIGNED NOT NULL,
    warehouse_id BIGINT UNSIGNED NOT NULL,
    variant_id BIGINT UNSIGNED NOT NULL,

    quantity INT NOT NULL,
    unit_cost DECIMAL(10,2) NOT NULL,
    discount DECIMAL(10,2) NOT NULL DEFAULT 0,
    subtotal DECIMAL(10,2) NOT NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_purchase_details_purchase
        FOREIGN KEY (purchase_id) REFERENCES purchases(id),
    CONSTRAINT fk_purchase_details_warehouse
        FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
    CONSTRAINT fk_purchase_details_variant
        FOREIGN KEY (variant_id) REFERENCES variants(id),
    CONSTRAINT chk_purchase_details_quantity CHECK (quantity > 0)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: purchase_payments
-- =====================================================

CREATE TABLE purchase_payments (

    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    purchase_id BIGINT UNSIGNED NOT NULL,
    payment_date DATETIME NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    reference VARCHAR(100),
    notes TEXT,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_purchase_payments_purchase
        FOREIGN KEY (purchase_id) REFERENCES purchases(id)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: purchase_returns / purchase_return_details
-- =====================================================

CREATE TABLE purchase_returns (

    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    purchase_id BIGINT UNSIGNED NOT NULL,
    return_date DATETIME NOT NULL,
    reason TEXT NOT NULL,
    status ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_purchase_returns_purchase
        FOREIGN KEY (purchase_id) REFERENCES purchases(id)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE purchase_return_details (

    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    purchase_return_id BIGINT UNSIGNED NOT NULL,
    warehouse_id BIGINT UNSIGNED NOT NULL,
    variant_id BIGINT UNSIGNED NOT NULL,
    quantity INT NOT NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_purchase_return_details_return
        FOREIGN KEY (purchase_return_id) REFERENCES purchase_returns(id),
    CONSTRAINT fk_purchase_return_details_warehouse
        FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
    CONSTRAINT fk_purchase_return_details_variant
        FOREIGN KEY (variant_id) REFERENCES variants(id),
    CONSTRAINT chk_purchase_return_details_quantity CHECK (quantity > 0)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
