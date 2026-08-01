USE moster_pink;

-- =====================================================
-- NOTA IMPORTANTE SOBRE ESTE ARCHIVO
-- La versión anterior creaba una tabla "customers" separada
-- de "users", pero sin ninguna columna que la conectara con
-- users(id). Esto rompía el login: un cliente se autentica
-- con el correo/contraseña guardados en "users" (RF-002),
-- pero sus direcciones, favoritos, reseñas y carrito
-- quedaban huérfanos en una tabla sin relación.
--
-- El Documento 2 (Arquitectura, Cap. 5.4 y 6.13) confirma que
-- el modelo NO contempla una entidad "Customer" aparte: los
-- pedidos, favoritos y reseñas cuelgan directamente de "users"
-- (el rol "Cliente" en la tabla roles es lo que distingue a
-- un cliente de un administrador o empleado).
--
-- Por eso aquí todo referencia a users(id).
-- =====================================================

-- =====================================================
-- TABLA: customer_addresses (RF-037)
-- =====================================================

CREATE TABLE customer_addresses (

    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,

    alias VARCHAR(100),
    recipient_name VARCHAR(200) NOT NULL,
    phone VARCHAR(20),
    street VARCHAR(255) NOT NULL,
    exterior_number VARCHAR(20),
    interior_number VARCHAR(20),
    neighborhood VARCHAR(150),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(10),
    country VARCHAR(100) NOT NULL DEFAULT 'México',
    is_default BOOLEAN NOT NULL DEFAULT FALSE,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,

    CONSTRAINT fk_customer_addresses_user
        FOREIGN KEY (user_id) REFERENCES users(id)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: favorites (RF-035, RN-032)
-- =====================================================

CREATE TABLE favorites (

    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    product_id BIGINT UNSIGNED NOT NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_favorites_user
        FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_favorites_product
        FOREIGN KEY (product_id) REFERENCES products(id),
    CONSTRAINT uq_favorite UNIQUE (user_id, product_id)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: reviews (RF-036, RN-030, RN-031)
-- RN-030: solo puede opinar quien compró el producto.
-- RN-031: una sola opinión por pedido/producto.
-- Por eso order_id es obligatorio: sin él no se puede
-- verificar la compra ni aplicar el límite "por pedido".
-- La FK hacia orders(id) se agrega en 06_orders.sql, una vez
-- que la tabla "orders" ya existe (orden de creación de
-- archivos).
-- =====================================================

CREATE TABLE reviews (

    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    product_id BIGINT UNSIGNED NOT NULL,
    order_id BIGINT UNSIGNED NOT NULL,

    rating TINYINT NOT NULL,
    comment TEXT,
    photo_url VARCHAR(500),
    is_approved BOOLEAN NOT NULL DEFAULT FALSE,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_reviews_user
        FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_reviews_product
        FOREIGN KEY (product_id) REFERENCES products(id),
    CONSTRAINT uq_review_per_order UNIQUE (user_id, product_id, order_id),
    CONSTRAINT chk_reviews_rating CHECK (rating BETWEEN 1 AND 5)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: cart_items (RF-029)
-- Carrito simple: una fila por usuario + variante.
-- =====================================================

CREATE TABLE cart_items (

    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    variant_id BIGINT UNSIGNED NOT NULL,
    quantity INT NOT NULL DEFAULT 1,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_cart_items_user
        FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_cart_items_variant
        FOREIGN KEY (variant_id) REFERENCES variants(id),
    CONSTRAINT uq_cart_item UNIQUE (user_id, variant_id),
    CONSTRAINT chk_cart_items_quantity CHECK (quantity > 0)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
