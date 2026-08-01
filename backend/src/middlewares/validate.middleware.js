import { validationResult } from "express-validator";
import ApiError from "../utils/ApiError.js";

// Se coloca después de un arreglo de validaciones de express-validator.
// Si hay errores, corta la petición con un 422 y el detalle de cada campo.
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const details = errors.array().map((e) => ({
      field: e.path,
      message: e.msg,
    }));

    const error = new ApiError(422, "Los datos enviados no son válidos.");
    error.details = details;
    return next(error);
  }

  next();
};

export default validate;