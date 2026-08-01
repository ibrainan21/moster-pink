USE moster_pink;

-- =====================================================
-- SEED DE DATOS INICIALES
-- Este archivo estaba vacío (0 bytes) en el proyecto original.
-- Sin estos registros, ninguna tabla con FK obligatoria hacia
-- roles/warehouses/company se puede usar: por ejemplo, no se
-- puede crear ni un solo usuario porque "role_id" es NOT NULL
-- y la tabla roles no tenía filas.
-- =====================================================

-- =====================================================
-- ROLES (RF-005, SRS 1.7)
-- =====================================================

INSERT INTO roles (name, description) VALUES
('Administrador', 'Propietario del negocio, acceso completo al sistema'),
('Empleado',       'Acceso limitado a las funciones autorizadas por el administrador'),
('Cliente',        'Usuario que realiza compras en la tienda en línea');

-- =====================================================
-- PERMISOS BÁSICOS POR MÓDULO
-- =====================================================

INSERT INTO permissions (name, code, module) VALUES
('Ver productos',        'products.view',    'products'),
('Administrar productos','products.manage',  'products'),
('Ver inventario',       'inventory.view',    'inventory'),
('Administrar inventario','inventory.manage', 'inventory'),
('Ver compras',          'purchases.view',    'purchases'),
('Administrar compras',  'purchases.manage',  'purchases'),
('Ver pedidos',          'orders.view',       'orders'),
('Administrar pedidos',  'orders.manage',     'orders'),
('Ver dashboard',        'dashboard.view',    'dashboard'),
('Administrar usuarios', 'users.manage',      'users'),
('Administrar contenido','content.manage',    'content'),
('Administrar finanzas', 'finances.manage',   'finances');

-- Administrador: todos los permisos.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Administrador';

-- Empleado: solo operación diaria (inventario, pedidos, compras y productos en modo lectura).
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
INNER JOIN permissions p
    ON p.code IN (
        'products.view',
        'inventory.view',
        'inventory.manage',
        'purchases.view',
        'orders.view',
        'orders.manage'
    )
WHERE r.name = 'Empleado';

-- =====================================================
-- ALMACÉN PRINCIPAL
-- =====================================================

INSERT INTO warehouses (name, code, address) VALUES
('Almacén Principal', 'MP-01', 'Sucursal única - Moster Pink');

-- =====================================================
-- USUARIO ADMINISTRADOR INICIAL
--
-- IMPORTANTE: "password" DEBE ser un hash de bcrypt generado
-- por el backend (nunca texto plano). El valor de abajo es
-- solo un marcador de posición ($2b$10$... con 60 caracteres)
-- para que el INSERT no falle; reemplázalo antes de usarlo.
--
-- Genera el hash real con Node así:
--   node -e "console.log(require('bcrypt').hashSync('TU_PASSWORD', 10))"
-- =====================================================

INSERT INTO users (role_id, first_name, last_name, email, password, is_active)
SELECT
    r.id,
    'Ibrain',
    'Aldama Nava',
    'admin@monsterpink.com',
    '$2b$10$CHANGE.THIS.HASH.BEFORE.GOING.TO.PRODUCTION.PLEASEXXXX',
    TRUE
FROM roles r
WHERE r.name = 'Administrador';

-- =====================================================
-- DATOS DE LA EMPRESA
-- =====================================================

INSERT INTO company (name, legal_name, phone, email, address)
VALUES (
    'Moster Pink',
    'Moster Pink',
    '',
    'contacto@monsterpink.com',
    'México'
);

-- =====================================================
-- CATEGORÍAS DE GASTOS (RF-044.1)
-- =====================================================

INSERT INTO expense_categories (name) VALUES
('Compra de mercancía'),
('Empaques'),
('Envíos'),
('Publicidad'),
('Renta'),
('Servicios'),
('Material de decoración'),
('Papelería');

-- =====================================================
-- CONFIGURACIÓN GENERAL DEL SISTEMA
-- =====================================================

INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('site_name',            'Moster Pink', 'Nombre público de la tienda'),
('currency',              'MXN',        'Moneda utilizada en la tienda'),
('default_low_stock',     '5',          'Stock mínimo por defecto para nuevas variantes'),
('session_timeout_minutes','60',        'Minutos de inactividad antes de expirar la sesión (RNF-011)');

-- =====================================================
-- PLANTILLAS DE NOTIFICACIÓN BÁSICAS (CU-039)
-- =====================================================

INSERT INTO notification_templates (name, subject, message, channel) VALUES
('order_confirmation', 'Tu pedido ha sido recibido',
 'Hola {first_name}, recibimos tu pedido {order_number}. Te avisaremos cuando esté en camino.',
 'EMAIL'),
('low_stock_alert', NULL,
 'Alerta: el producto {product_name} está por debajo del stock mínimo.',
 'EMAIL'),
('order_shipped', 'Tu pedido va en camino',
 'Hola {first_name}, tu pedido {order_number} fue enviado. Número de guía: {tracking_number}.',
 'WHATSAPP');
