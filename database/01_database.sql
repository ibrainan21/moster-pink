-- =====================================================
-- MOSTER PINK - BASE DE DATOS
-- Archivo: 01_database.sql
-- Descripción: Creación de la base de datos principal.
-- =====================================================

DROP DATABASE IF EXISTS moster_pink;

CREATE DATABASE moster_pink
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE moster_pink;

-- Buenas prácticas para que las restricciones (FK, NOT NULL, etc.)
-- sean respetadas de forma estricta por el motor.
SET SQL_MODE = 'STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO';
