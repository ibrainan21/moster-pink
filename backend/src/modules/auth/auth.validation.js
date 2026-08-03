import { body } from "express-validator";

// gmail_remove_dots: false / gmail_remove_subaddress: false
// -> IMPORTANTE: sin esto, normalizeEmail() le quita los puntos a
// cualquier correo @gmail.com (ej. "mp.monstruo.rosa@gmail.com" se
// convertía en "mpmonstruorosa@gmail.com"), lo cual nunca hacía match
// contra el correo real guardado en la base de datos.
const emailChain = () =>
  body("email")
    .trim()
    .isEmail()
    .withMessage("Correo electrónico inválido.")
    .normalizeEmail({ gmail_remove_dots: false, gmail_remove_subaddress: false });

const passwordRule = body("password")
  .isLength({ min: 8 })
  .withMessage("La contraseña debe tener al menos 8 caracteres.");

export const registerValidation = [
  body("firstName").trim().notEmpty().withMessage("El nombre es obligatorio."),
  body("lastName").trim().notEmpty().withMessage("El apellido es obligatorio."),
  emailChain(),
  passwordRule,
  body("phone").optional({ nullable: true }).isString(),
];

export const loginValidation = [
  emailChain(),
  body("password").notEmpty().withMessage("La contraseña es obligatoria."),
];

export const forgotPasswordValidation = [emailChain()];

export const resetPasswordValidation = [
  emailChain(),
  body("code").isLength({ min: 6, max: 6 }).withMessage("El código debe tener 6 dígitos."),
  body("newPassword")
    .isLength({ min: 8 })
    .withMessage("La nueva contraseña debe tener al menos 8 caracteres."),
];

export const changePasswordValidation = [
  body("currentPassword").notEmpty().withMessage("La contraseña actual es obligatoria."),
  body("newPassword")
    .isLength({ min: 8 })
    .withMessage("La nueva contraseña debe tener al menos 8 caracteres."),
];