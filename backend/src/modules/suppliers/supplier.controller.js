import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import SupplierService from "./supplier.service.js";

class SupplierController {
  // GET /api/suppliers  (RF-025, CU-019)
  list = asyncHandler(async (req, res) => {
    const result = await SupplierService.list(req.query);
    res.json(ApiResponse.success("Proveedores obtenidos correctamente.", result));
  });

  // GET /api/suppliers/select  (para llenar el <select> al crear una compra)
  listForSelect = asyncHandler(async (req, res) => {
    const suppliers = await SupplierService.listForSelect();
    res.json(ApiResponse.success("Proveedores obtenidos correctamente.", suppliers));
  });

  // GET /api/suppliers/:id
  getOne = asyncHandler(async (req, res) => {
    const supplier = await SupplierService.getById(req.params.id);
    res.json(ApiResponse.success("Proveedor obtenido correctamente.", supplier));
  });

  // POST /api/suppliers
  create = asyncHandler(async (req, res) => {
    const supplier = await SupplierService.create(req.body);
    res.status(201).json(ApiResponse.success("Proveedor creado correctamente.", supplier));
  });

  // PUT /api/suppliers/:id
  update = asyncHandler(async (req, res) => {
    const supplier = await SupplierService.update(req.params.id, req.body);
    res.json(ApiResponse.success("Proveedor actualizado correctamente.", supplier));
  });

  // PATCH /api/suppliers/:id/status
  setActive = asyncHandler(async (req, res) => {
    const supplier = await SupplierService.setActive(req.params.id, req.body.isActive);
    res.json(ApiResponse.success("Estado del proveedor actualizado.", supplier));
  });

  // DELETE /api/suppliers/:id
  remove = asyncHandler(async (req, res) => {
    await SupplierService.remove(req.params.id);
    res.json(ApiResponse.success("Proveedor eliminado correctamente."));
  });
}

export default new SupplierController();
