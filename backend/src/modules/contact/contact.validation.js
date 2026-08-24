import { body } from "express-validator";

export const sendContactValidation = [
  body("name").trim().notEmpty().withMessage("Ingresa tu nombre.").isLength({ max: 150 }),
  body("email").trim().isEmail().withMessage("Ingresa un correo válido.").normalizeEmail(),
  body("phone").optional({ nullable: true }).trim().isLength({ max: 20 }),
  body("subject").optional({ nullable: true }).trim().isLength({ max: 150 }),
  body("message")
    .trim()
    .notEmpty()
    .withMessage("Escribe tu mensaje.")
    .isLength({ min: 10, max: 2000 })
    .withMessage("El mensaje debe tener entre 10 y 2000 caracteres."),
];
