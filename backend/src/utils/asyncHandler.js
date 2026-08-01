// Envuelve un controlador async y reenvía cualquier error a errorMiddleware
// en vez de tener que escribir try/catch en cada controlador.
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
