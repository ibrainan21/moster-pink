USE moster_pink;

-- =====================================================
-- TABLA: seasons (RF-011, RF-014, RN-012, RN-034)
-- Antes no existía ninguna tabla de temporadas, aunque el
-- SRS la exige explícitamente (San Valentín, Día de las
-- Madres, Halloween, Navidad, etc.).
-- =====================================================

CREATE TABLE seasons (

    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(120) NOT NULL,
    description TEXT,
    banner_image VARCHAR(500),

    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT uq_seasons_slug UNIQUE (slug),
    CONSTRAINT chk_seasons_dates CHECK (end_date >= start_date)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE product_seasons (

    product_id BIGINT UNSIGNED NOT NULL,
    season_id BIGINT UNSIGNED NOT NULL,

    PRIMARY KEY (product_id, season_id),

    CONSTRAINT fk_product_seasons_product
        FOREIGN KEY (product_id) REFERENCES products(id),
    CONSTRAINT fk_product_seasons_season
        FOREIGN KEY (season_id) REFERENCES seasons(id)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: promotions (RF-038)
-- =====================================================

CREATE TABLE promotions (

    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,

    discount_type ENUM('PERCENTAGE','FIXED_AMOUNT') NOT NULL,
    discount_value DECIMAL(10,2) NOT NULL,
    minimum_purchase DECIMAL(10,2) NOT NULL DEFAULT 0,

    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_by BIGINT UNSIGNED NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_promotions_user
        FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT chk_promotions_dates CHECK (end_date >= start_date)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE promotion_products (

    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    promotion_id BIGINT UNSIGNED NOT NULL,
    product_id BIGINT UNSIGNED NOT NULL,

    CONSTRAINT fk_promotion_products_promotion
        FOREIGN KEY (promotion_id) REFERENCES promotions(id),
    CONSTRAINT fk_promotion_products_product
        FOREIGN KEY (product_id) REFERENCES products(id),
    CONSTRAINT uq_promotion_product UNIQUE (promotion_id, product_id)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: coupons / coupon_usage (RF-038, RN-035)
-- =====================================================

CREATE TABLE coupons (

    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL,
    description VARCHAR(255),

    discount_type ENUM('PERCENTAGE','FIXED_AMOUNT') NOT NULL,
    discount_value DECIMAL(10,2) NOT NULL,
    minimum_purchase DECIMAL(10,2) NOT NULL DEFAULT 0,

    usage_limit INT,
    used_count INT NOT NULL DEFAULT 0,

    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_by BIGINT UNSIGNED NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_coupons_user
        FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT uq_coupon_code UNIQUE (code),
    CONSTRAINT chk_coupons_dates CHECK (end_date >= start_date)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE coupon_usage (

    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    coupon_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    order_id BIGINT UNSIGNED NOT NULL,

    used_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_coupon_usage_coupon
        FOREIGN KEY (coupon_id) REFERENCES coupons(id),
    CONSTRAINT fk_coupon_usage_user
        FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_coupon_usage_order
        FOREIGN KEY (order_id) REFERENCES orders(id),
    CONSTRAINT uq_coupon_usage_order UNIQUE (coupon_id, order_id)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: gift_cards
-- =====================================================

CREATE TABLE gift_cards (

    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL,
    initial_balance DECIMAL(10,2) NOT NULL,
    current_balance DECIMAL(10,2) NOT NULL,
    expiration_date DATE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_gift_card_code UNIQUE (code)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
