-- =====================================================
-- MOSTER PINK - BASE DE DATOS
-- Archivo: 15_conocenos_y_recoger_en_tienda.sql
-- Descripción: ALTER TABLE puntuales para dos features nuevas:
--   1) Descripción de la empresa para la sección "Conócenos" del Home.
--   2) Modalidad de entrega del pedido (envío a domicilio / recoger en
--      tienda). No se re-crea nada, solo se agregan columnas a tablas
--      que ya existen en producción.
-- =====================================================

USE railway;

ALTER TABLE company
  ADD COLUMN about TEXT NULL AFTER logo_url;

ALTER TABLE orders
  ADD COLUMN delivery_method ENUM('SHIPPING', 'PICKUP') NOT NULL DEFAULT 'SHIPPING' AFTER address_id;

-- Verificación: corre esto después y confírmame el resultado.
DESCRIBE company;
DESCRIBE orders;
