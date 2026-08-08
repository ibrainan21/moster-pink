import ApiError from "../../utils/ApiError.js";
import SupplierRepository from "./supplier.repository.js";

class SupplierService {
  async list(query) {
    const { page = 1, limit = 20, search = null, onlyActive } = query;
    return SupplierRepository.list({
      page,
      limit,
      search: search || null,
      onlyActive: onlyActive === "true" || onlyActive === true,
    });
  }

  async listForSelect() {
    return SupplierRepository.listActiveForSelect();
  }

  async getById(id) {
    const supplier = await SupplierRepository.getById(id);
    if (!supplier) throw new ApiError(404, "Proveedor no encontrado.");
    return supplier;
  }

  async create(data) {
    const existing = await SupplierRepository.findByName(data.name);
    if (existing) throw new ApiError(409, "Ya existe un proveedor con ese nombre.");
    return SupplierRepository.create(data);
  }

  async update(id, data) {
    await this.getById(id);

    const existing = await SupplierRepository.findByName(data.name);
    if (existing && existing.id !== Number(id)) {
      throw new ApiError(409, "Ya existe un proveedor con ese nombre.");
    }

    return SupplierRepository.update(id, data);
  }

  async setActive(id, isActive) {
    await this.getById(id);
    return SupplierRepository.setActive(id, isActive);
  }

  // RN-009 (aplicado por consistencia): no se elimina físicamente si tiene compras.
  async remove(id) {
    await this.getById(id);
    const purchaseCount = await SupplierRepository.countPurchases(id);

    if (purchaseCount > 0) {
      throw new ApiError(
        409,
        `No se puede eliminar: el proveedor tiene ${purchaseCount} compra(s) registrada(s). Desactívalo en su lugar.`
      );
    }

    await SupplierRepository.softDelete(id);
  }
}

export default new SupplierService();
