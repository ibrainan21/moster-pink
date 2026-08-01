// Script temporal: genera el hash de bcrypt y actualiza directamente al
// usuario administrador, para evitar errores de copiar/pegar el hash a mano.
//
// Uso:
//   node setAdminPassword.js correo@ejemplo.com "MiPasswordNueva123"
//
// Bórralo cuando termines de usarlo.

import bcrypt from "bcrypt";
import dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config();

const [, , email, plainPassword] = process.argv;

if (!email || !plainPassword) {
  console.error('Uso: node setAdminPassword.js correo@ejemplo.com "MiPasswordNueva123"');
  process.exit(1);
}

const run = async () => {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    const hash = await bcrypt.hash(plainPassword, Number(process.env.BCRYPT_SALT_ROUNDS) || 10);

    const [result] = await pool.query(
      "UPDATE users SET password = ? WHERE email = ?",
      [hash, email]
    );

    if (result.affectedRows === 0) {
      console.error(`❌ No se encontró ningún usuario con el correo: ${email}`);
      console.error("   Revisa que el correo exista en la tabla 'users' (SELECT email FROM users;)");
    } else {
      console.log(`✅ Contraseña actualizada correctamente para: ${email}`);
      console.log(`   Ahora puedes iniciar sesión con esa contraseña.`);
    }
  } catch (err) {
    console.error("❌ Error al conectar o actualizar la base de datos:");
    console.error(err.message);
  } finally {
    await pool.end();
  }
};

run();