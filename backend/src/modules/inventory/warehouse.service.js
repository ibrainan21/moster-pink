import ApiError from "../../utils/ApiError.js";
import WarehouseRepository from "./warehouse.repository.js";

class WarehouseService {
  async list(onlyActive) {
    return WarehouseRepository.list({ onlyActive });
  }

  async getById(id) {
    const warehouse = await WarehouseRepository.getById(id);
    if (!warehouse) throw new ApiError(404, "Almacén no encontrado.");
    return warehouse;
  }

  async create(data) {
    const existing = await WarehouseRepository.findByCode(data.code);
    if (existing) throw new ApiError(409, "Ya existe un almacén con ese código.");
    return WarehouseRepository.create(data);
  }

  async update(id, data) {
    await this.getById(id);
    const existing = await WarehouseRepository.findByCode(data.code);
    if (existing && existing.id !== Number(id)) {
      throw new ApiError(409, "Ya existe un almacén con ese código.");
    }
    return WarehouseRepository.update(id, data);
  }

  async setActive(id, isActive) {
    await this.getById(id);
    return WarehouseRepository.setActive(id, isActive);
  }

  async remove(id) {
    await this.getById(id);
    const count = await WarehouseRepository.countInventoryRows(id);
    if (count > 0) {
      throw new ApiError(
        409,
        `No se puede eliminar: el almacén tiene ${count} variante(s) con existencias. Desactívalo en su lugar.`
      );
    }
    await WarehouseRepository.softDelete(id);
  }
}

export default new WarehouseService();
