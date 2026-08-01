USE moster_pink;

-- =====================================================
-- TABLA: ai_models
-- =====================================================

CREATE TABLE ai_models (

    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    provider VARCHAR(100) NOT NULL,
    version VARCHAR(50),
    api_endpoint VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT uq_ai_model UNIQUE (name, version)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: ai_conversations / ai_messages (RF-045)
-- user_id es opcional porque el recomendador por reglas puede
-- usarse sin haber iniciado sesión (visitante anónimo
-- identificado solo por session_token).
-- =====================================================

CREATE TABLE ai_conversations (

    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NULL,
    session_token VARCHAR(255),

    started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ended_at DATETIME,

    CONSTRAINT fk_ai_conversation_user
        FOREIGN KEY (user_id) REFERENCES users(id)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ai_messages (

    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    conversation_id BIGINT UNSIGNED NOT NULL,
    sender ENUM('USER','ASSISTANT','SYSTEM') NOT NULL,
    message TEXT NOT NULL,
    tokens_used INT,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ai_messages_conversation
        FOREIGN KEY (conversation_id) REFERENCES ai_conversations(id)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: ai_recommendations (RF-046, RN-045)
-- =====================================================

CREATE TABLE ai_recommendations (

    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NULL,
    product_id BIGINT UNSIGNED NOT NULL,
    score DECIMAL(5,2),
    reason VARCHAR(255),
    was_purchased BOOLEAN NOT NULL DEFAULT FALSE,

    generated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ai_recommendations_user
        FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_ai_recommendations_product
        FOREIGN KEY (product_id) REFERENCES products(id)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: ai_predictions
-- =====================================================

CREATE TABLE ai_predictions (

    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    prediction_type ENUM('SALES','STOCK','CUSTOMER') NOT NULL,
    reference_id BIGINT UNSIGNED,
    predicted_value DECIMAL(12,2),
    confidence DECIMAL(5,2),
    prediction_date DATE,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ai_prompt_history (

    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    model_id BIGINT UNSIGNED NOT NULL,
    prompt TEXT NOT NULL,
    response LONGTEXT,
    execution_time_ms INT,
    tokens_used INT,
    created_by BIGINT UNSIGNED,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ai_prompt_model
        FOREIGN KEY (model_id) REFERENCES ai_models(id),
    CONSTRAINT fk_ai_prompt_user
        FOREIGN KEY (created_by) REFERENCES users(id)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: product_views (RF-047)
-- Registra qué productos consulta cada visitante y cuánto
-- tiempo pasó viéndolos; insumo directo para el dataset de IA.
-- =====================================================

CREATE TABLE product_views (

    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NULL,
    session_token VARCHAR(255),
    duration_seconds INT,

    viewed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_product_views_product
        FOREIGN KEY (product_id) REFERENCES products(id),
    CONSTRAINT fk_product_views_user
        FOREIGN KEY (user_id) REFERENCES users(id)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: search_logs (RF-047)
-- =====================================================

CREATE TABLE search_logs (

    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NULL,
    session_token VARCHAR(255),
    query VARCHAR(255) NOT NULL,
    results_count INT NOT NULL DEFAULT 0,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_search_logs_user
        FOREIGN KEY (user_id) REFERENCES users(id)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
