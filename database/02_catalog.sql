USE moster_pink;

-- =====================================================
-- TABLA: roles
-- Administrador / Empleado / Cliente (SRS 1.7, RF-005)
-- =====================================================

CREATE TABLE roles (

    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,

    CONSTRAINT uq_roles_name UNIQUE (name)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: permissions
-- =====================================================

CREATE TABLE permissions (

    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    module VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT uq_permissions_name UNIQUE (name),
    CONSTRAINT uq_permissions_code UNIQUE (code)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: role_permissions
-- =====================================================

CREATE TABLE role_permissions (

    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    role_id BIGINT UNSIGNED NOT NULL,
    permission_id BIGINT UNSIGNED NOT NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_role_permissions_role
        FOREIGN KEY (role_id) REFERENCES roles(id),
    CONSTRAINT fk_role_permissions_permission
        FOREIGN KEY (permission_id) REFERENCES permissions(id),
    CONSTRAINT uq_role_permission UNIQUE (role_id, permission_id)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: users
-- ÚNICA tabla de identidad para Administrador, Empleado y
-- Cliente (Documento 2, Cap. 5.4: "Usuarios... Realizar
-- muchos pedidos / Guardar favoritos / Publicar opiniones").
-- No existe una tabla "customers" separada: el rol define
-- el tipo de usuario (RF-005, RN-003).
-- =====================================================

CREATE TABLE users (

    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    role_id BIGINT UNSIGNED NOT NULL,

    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    profile_photo VARCHAR(255),

    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login DATETIME NULL,
    email_verified_at DATETIME NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,

    CONSTRAINT fk_users_role
        FOREIGN KEY (role_id) REFERENCES roles(id),
    CONSTRAINT uq_users_email UNIQUE (email)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Referencias tardías de auditoría (created_by/updated_by apuntan
-- a la misma tabla; se agregan después de crearla).
ALTER TABLE users
    ADD CONSTRAINT fk_users_created_by FOREIGN KEY (created_by) REFERENCES users(id),
    ADD CONSTRAINT fk_users_updated_by FOREIGN KEY (updated_by) REFERENCES users(id);

-- =====================================================
-- TABLA: password_resets (RF-003)
-- Códigos temporales de recuperación de contraseña.
-- =====================================================

CREATE TABLE password_resets (

    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    code VARCHAR(10) NOT NULL,
    expires_at DATETIME NOT NULL,
    used_at DATETIME NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_password_resets_user
        FOREIGN KEY (user_id) REFERENCES users(id)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: categories
-- =====================================================

CREATE TABLE categories (

    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(150) NOT NULL,
    description TEXT,
    image_url VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT DEFAULT 0,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,

    CONSTRAINT uq_categories_name UNIQUE (name),
    CONSTRAINT uq_categories_slug UNIQUE (slug)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: subcategories
-- =====================================================

CREATE TABLE subcategories (

    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    category_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(150) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,

    CONSTRAINT fk_subcategories_category
        FOREIGN KEY (category_id) REFERENCES categories(id),
    CONSTRAINT uq_subcategory UNIQUE (category_id, name),
    CONSTRAINT uq_subcategory_slug UNIQUE (slug)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: suppliers
-- =====================================================

CREATE TABLE suppliers (

    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    contact_name VARCHAR(150),
    phone VARCHAR(20),
    email VARCHAR(150),
    address TEXT,
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,

    CONSTRAINT uq_supplier_name UNIQUE (name)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: products
-- RN-007: un producto SIEMPRE está en un único estado
-- (Activo / Inactivo / Descontinuado) -> se modela con un
-- solo ENUM "status" en vez de dos booleanos independientes
-- (is_active + is_discontinued), que permitían combinaciones
-- inválidas.
-- RF-010: etiqueta "Nuevo" expira sola -> new_until.
-- RF-014: programación de publicación/despublicación.
-- RF-008.1: producto descontinuado conserva discontinued_at.
-- =====================================================

CREATE TABLE products (

    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    category_id BIGINT UNSIGNED NOT NULL,
    subcategory_id BIGINT UNSIGNED,
    supplier_id BIGINT UNSIGNED,

    name VARCHAR(200) NOT NULL,
    slug VARCHAR(220) NOT NULL,
    short_description VARCHAR(500),
    description TEXT,
    sku VARCHAR(100),
    barcode VARCHAR(100),

    cost DECIMAL(10,2) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    weight DECIMAL(8,2),

    status ENUM('ACTIVE','INACTIVE','DISCONTINUED')
        NOT NULL DEFAULT 'ACTIVE',

    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    is_new BOOLEAN NOT NULL DEFAULT FALSE,
    new_until DATETIME NULL,

    published_at DATETIME NULL,
    unpublish_at DATETIME NULL,
    discontinued_at DATETIME NULL,

    seo_title VARCHAR(255),
    seo_description VARCHAR(500),

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,

    CONSTRAINT fk_products_category
        FOREIGN KEY (category_id) REFERENCES categories(id),
    CONSTRAINT fk_products_subcategory
        FOREIGN KEY (subcategory_id) REFERENCES subcategories(id),
    CONSTRAINT fk_products_supplier
        FOREIGN KEY (supplier_id) REFERENCES suppliers(id),

    CONSTRAINT uq_products_slug UNIQUE (slug),
    CONSTRAINT uq_products_sku UNIQUE (sku)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: product_price_history (RF-007, RF-028.1)
-- Conserva el historial cuando cambian costo o precio.
-- =====================================================

CREATE TABLE product_price_history (

    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT UNSIGNED NOT NULL,
    previous_cost DECIMAL(10,2) NOT NULL,
    previous_price DECIMAL(10,2) NOT NULL,
    new_cost DECIMAL(10,2) NOT NULL,
    new_price DECIMAL(10,2) NOT NULL,
    changed_by BIGINT UNSIGNED NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_price_history_product
        FOREIGN KEY (product_id) REFERENCES products(id),
    CONSTRAINT fk_price_history_user
        FOREIGN KEY (changed_by) REFERENCES users(id)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: variants (RF-016, RF-017, RN-013, RN-014)
-- =====================================================

CREATE TABLE variants (

    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT UNSIGNED NOT NULL,
    sku VARCHAR(100) NOT NULL,
    color VARCHAR(80),
    size VARCHAR(80),
    material VARCHAR(80),
    capacity VARCHAR(80),
    additional_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_variants_product
        FOREIGN KEY (product_id) REFERENCES products(id),
    CONSTRAINT uq_variant_sku UNIQUE (sku)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: tags / product_tags
-- =====================================================

CREATE TABLE tags (

    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(120) NOT NULL,

    CONSTRAINT uq_tags_name UNIQUE (name),
    CONSTRAINT uq_tags_slug UNIQUE (slug)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE product_tags (

    product_id BIGINT UNSIGNED NOT NULL,
    tag_id BIGINT UNSIGNED NOT NULL,

    PRIMARY KEY (product_id, tag_id),

    CONSTRAINT fk_product_tags_product
        FOREIGN KEY (product_id) REFERENCES products(id),
    CONSTRAINT fk_product_tags_tag
        FOREIGN KEY (tag_id) REFERENCES tags(id)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: product_attributes / attribute_values /
--        variant_attribute_values
-- =====================================================

CREATE TABLE product_attributes (

    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    input_type ENUM('TEXT','NUMBER','COLOR','SELECT') NOT NULL

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE attribute_values (

    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    attribute_id BIGINT UNSIGNED NOT NULL,
    value VARCHAR(100) NOT NULL,
    color_code VARCHAR(20),
    sort_order INT DEFAULT 0,

    CONSTRAINT fk_attribute_values_attribute
        FOREIGN KEY (attribute_id) REFERENCES product_attributes(id)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE variant_attribute_values (

    product_variant_id BIGINT UNSIGNED NOT NULL,
    attribute_value_id BIGINT UNSIGNED NOT NULL,

    PRIMARY KEY (product_variant_id, attribute_value_id),

    CONSTRAINT fk_variant_attribute_variant
        FOREIGN KEY (product_variant_id) REFERENCES variants(id),
    CONSTRAINT fk_variant_attribute_value
        FOREIGN KEY (attribute_value_id) REFERENCES attribute_values(id)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: product_images (RF-006, RF-018)
-- La imagen pertenece PRINCIPALMENTE al producto.
-- product_variant_id es OPCIONAL: solo se llena cuando una
-- variante tiene imágenes propias distintas a las generales.
-- (Antes esta tabla exigía product_variant_id NOT NULL, lo
-- cual hacía imposible tener imágenes de producto sin crear
-- variantes primero).
-- =====================================================

CREATE TABLE product_images (

    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT UNSIGNED NOT NULL,
    product_variant_id BIGINT UNSIGNED NULL,

    image_url VARCHAR(500) NOT NULL,
    alt_text VARCHAR(255),
    is_main BOOLEAN NOT NULL DEFAULT FALSE,
    position INT NOT NULL DEFAULT 1,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_product_images_product
        FOREIGN KEY (product_id) REFERENCES products(id),
    CONSTRAINT fk_product_images_variant
        FOREIGN KEY (product_variant_id) REFERENCES variants(id)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: product_videos (RF-006 - video opcional)
-- =====================================================

CREATE TABLE product_videos (

    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT UNSIGNED NOT NULL,
    video_url VARCHAR(500) NOT NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_product_videos_product
        FOREIGN KEY (product_id) REFERENCES products(id)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: related_products (RF-012)
-- Relación manual N:N de productos relacionados.
-- Auto-referenciada; se guarda en un solo sentido y la
-- aplicación puede mostrarla en ambos.
-- =====================================================

CREATE TABLE related_products (

    product_id BIGINT UNSIGNED NOT NULL,
    related_product_id BIGINT UNSIGNED NOT NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (product_id, related_product_id),

    CONSTRAINT fk_related_products_product
        FOREIGN KEY (product_id) REFERENCES products(id),
    CONSTRAINT fk_related_products_related
        FOREIGN KEY (related_product_id) REFERENCES products(id),
    CONSTRAINT chk_related_products_diff
        CHECK (product_id <> related_product_id)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLAS: combos / combo_items (RF-013, RN-036, RN-037, RN-038)
-- Un combo es un producto compuesto por otros productos.
-- =====================================================

CREATE TABLE combos (

    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(220) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image_url VARCHAR(500),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,

    CONSTRAINT uq_combos_slug UNIQUE (slug)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE combo_items (

    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    combo_id BIGINT UNSIGNED NOT NULL,
    variant_id BIGINT UNSIGNED NOT NULL,
    quantity INT NOT NULL DEFAULT 1,

    CONSTRAINT fk_combo_items_combo
        FOREIGN KEY (combo_id) REFERENCES combos(id),
    CONSTRAINT fk_combo_items_variant
        FOREIGN KEY (variant_id) REFERENCES variants(id),
    CONSTRAINT uq_combo_item UNIQUE (combo_id, variant_id),
    CONSTRAINT chk_combo_item_quantity CHECK (quantity > 0)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
