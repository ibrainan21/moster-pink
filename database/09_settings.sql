USE moster_pink;

-- =====================================================
-- TABLA: company
-- =====================================================

CREATE TABLE company (

    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    legal_name VARCHAR(200),
    rfc VARCHAR(20),
    phone VARCHAR(20),
    email VARCHAR(150),
    website VARCHAR(255),
    address TEXT,
    logo_url VARCHAR(255),

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: social_links (RF-042)
-- =====================================================

CREATE TABLE social_links (

    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    platform VARCHAR(50) NOT NULL,
    url VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 0,

    CONSTRAINT uq_social_links_platform UNIQUE (platform)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: banners (RF-039, RF-040)
-- "type" distingue el banner principal del carrusel, para no
-- duplicar estructura (RF-039 y RF-040 son, en esencia, el
-- mismo tipo de contenido con distinto uso en el home).
-- =====================================================

CREATE TABLE banners (

    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    type ENUM('MAIN_BANNER','CAROUSEL') NOT NULL DEFAULT 'CAROUSEL',
    title VARCHAR(150),
    image_url VARCHAR(500) NOT NULL,
    link_url VARCHAR(500),
    position INT NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    start_date DATETIME NULL,
    end_date DATETIME NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: galleries (RF-041)
-- =====================================================

CREATE TABLE galleries (

    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150),
    image_url VARCHAR(500) NOT NULL,
    category VARCHAR(100),
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: system_settings
-- =====================================================

CREATE TABLE system_settings (

    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL,
    setting_value TEXT,
    description VARCHAR(255),
    updated_by BIGINT UNSIGNED,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_system_settings_user
        FOREIGN KEY (updated_by) REFERENCES users(id),
    CONSTRAINT uq_setting_key UNIQUE (setting_key)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: notification_templates / notifications (CU-039)
-- =====================================================

CREATE TABLE notification_templates (

    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    subject VARCHAR(255),
    message TEXT NOT NULL,
    channel ENUM('EMAIL','SMS','WHATSAPP') NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT uq_notification_template UNIQUE (name, channel)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE notifications (

    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NULL,
    template_id BIGINT UNSIGNED NULL,
    channel ENUM('EMAIL','SMS','WHATSAPP') NOT NULL,
    subject VARCHAR(255),
    message TEXT NOT NULL,
    status ENUM('PENDING','SENT','FAILED') NOT NULL DEFAULT 'PENDING',
    sent_at DATETIME NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_notifications_user
        FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_notifications_template
        FOREIGN KEY (template_id) REFERENCES notification_templates(id)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: api_keys
-- =====================================================

CREATE TABLE api_keys (

    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    service_name VARCHAR(100) NOT NULL,
    api_key TEXT NOT NULL,
    api_secret TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT uq_service_name UNIQUE (service_name)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: audit_log (RF-050, RN-043)
-- =====================================================

CREATE TABLE audit_log (

    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id BIGINT UNSIGNED,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_audit_log_user
        FOREIGN KEY (user_id) REFERENCES users(id)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
