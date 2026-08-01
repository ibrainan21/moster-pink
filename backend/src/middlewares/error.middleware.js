const errorMiddleware = (err, req, res, next) => {
  console.error(err);

  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Error interno del servidor",
    ...(err.details ? { details: err.details } : {}),
  });
};

export default errorMiddleware;