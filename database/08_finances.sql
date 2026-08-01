USE moster_pink;

-- =====================================================
-- TABLA: cash_registers / cash_movements
-- =====================================================

CREATE TABLE cash_registers (

    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    current_balance DECIMAL(10,2) NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE cash_movements (

    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    cash_register_id BIGINT UNSIGNED NOT NULL,
    movement_type ENUM('INCOME','EXPENSE') NOT NULL,
    concept VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    reference VARCHAR(100),
    created_by BIGINT UNSIGNED NOT NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_cash_movements_register
        FOREIGN KEY (cash_register_id) REFERENCES cash_registers(id),
    CONSTRAINT fk_cash_movements_user
        FOREIGN KEY (created_by) REFERENCES users(id)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: expense_categories (RF-044.1)
-- Catálogo con las categorías que el SRS enumera como
-- ejemplo (Compra de mercancía, Empaques, Envíos, etc.),
-- para no depender de texto libre.
-- =====================================================

CREATE TABLE expense_categories (

    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT uq_expense_categories_name UNIQUE (name)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: expenses (RF-044.1, RN-039)
-- =====================================================

CREATE TABLE expenses (

    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    category_id BIGINT UNSIGNED NOT NULL,
    description TEXT,
    amount DECIMAL(10,2) NOT NULL,
    expense_date DATE NOT NULL,
    payment_method VARCHAR(50),
    supplier_id BIGINT UNSIGNED,
    created_by BIGINT UNSIGNED NOT NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_expenses_category
        FOREIGN KEY (category_id) REFERENCES expense_categories(id),
    CONSTRAINT fk_expenses_supplier
        FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    CONSTRAINT fk_expenses_user
        FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT chk_expenses_amount CHECK (amount > 0)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: income (RF-044.2)
-- =====================================================

CREATE TABLE income (

    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    amount DECIMAL(10,2) NOT NULL,
    income_date DATE NOT NULL,
    order_id BIGINT UNSIGNED,
    created_by BIGINT UNSIGNED NOT NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_income_order
        FOREIGN KEY (order_id) REFERENCES orders(id),
    CONSTRAINT fk_income_user
        FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT chk_income_amount CHECK (amount > 0)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: financial_transactions (RF-044.2, RN-041)
-- =====================================================

CREATE TABLE financial_transactions (

    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    transaction_type ENUM('INCOME','EXPENSE','REFUND','ADJUSTMENT') NOT NULL,
    reference_type VARCHAR(50),
    reference_id BIGINT UNSIGNED,
    amount DECIMAL(10,2) NOT NULL,
    notes TEXT,
    created_by BIGINT UNSIGNED NOT NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_financial_transactions_user
        FOREIGN KEY (created_by) REFERENCES users(id)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
