import ApiError from "../../utils/ApiError.js";
import AddressRepository from "./address.repository.js";

class AddressService {
  async list(userId) {
    return AddressRepository.listByUser(userId);
  }

  async getOwned(userId, addressId) {
    const address = await AddressRepository.getById(addressId);
    if (!address || address.user_id !== Number(userId)) {
      throw new ApiError(404, "Dirección no encontrada.");
    }
    return address;
  }

  async create(userId, data) {
    const isFirst = (await AddressRepository.listByUser(userId)).length === 0;

    if (data.isDefault || isFirst) {
      await AddressRepository.clearDefault(userId);
    }

    const address = await AddressRepository.create(userId, {
      ...data,
      isDefault: data.isDefault || isFirst,
    });
    return address;
  }

  async update(userId, addressId, data) {
    await this.getOwned(userId, addressId);
    return AddressRepository.update(addressId, data);
  }

  async setDefault(userId, addressId) {
    await this.getOwned(userId, addressId);
    await AddressRepository.clearDefault(userId);
    return AddressRepository.setDefault(addressId);
  }

  async remove(userId, addressId) {
    await this.getOwned(userId, addressId);
    await AddressRepository.softDelete(addressId);
  }
}

export default new AddressService();
