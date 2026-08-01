import { body } from "express-validator";

const passwordRule = body("password")
  .isLength({ min: 8 })
  .withMessage("La contraseña debe tener al menos 8 caracteres.");

export const registerValidation = [
  body("firstName").trim().notEmpty().withMessage("El nombre es obligatorio."),
  body("lastName").trim().notEmpty().withMessage("El apellido es obligatorio."),
  body("email").trim().isEmail().withMessage("Correo electrónico inválido.").normalizeEmail(),
  passwordRule,
  body("phone").optional({ nullable: true }).isString(),
];

export const loginValidation = [
  body("email").trim().isEmail().withMessage("Correo electrónico inválido.").normalizeEmail(),
  body("password").notEmpty().withMessage("La contraseña es obligatoria."),
];

export const forgotPasswordValidation = [
  body("email").trim().isEmail().withMessage("Correo electrónico inválido.").normalizeEmail(),
];

export const resetPasswordValidation = [
  body("email").trim().isEmail().withMessage("Correo electrónico inválido.").normalizeEmail(),
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
