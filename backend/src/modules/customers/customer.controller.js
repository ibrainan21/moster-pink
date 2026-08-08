import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import AddressService from "./address.service.js";
import FavoriteService from "./favorite.service.js";

class CustomerController {
  // --- Direcciones (RF-037) ---

  listAddresses = asyncHandler(async (req, res) => {
    const addresses = await AddressService.list(req.user.id);
    res.json(ApiResponse.success("Direcciones obtenidas correctamente.", addresses));
  });

  createAddress = asyncHandler(async (req, res) => {
    const address = await AddressService.create(req.user.id, req.body);
    res.status(201).json(ApiResponse.success("Dirección agregada correctamente.", address));
  });

  updateAddress = asyncHandler(async (req, res) => {
    const address = await AddressService.update(req.user.id, req.params.addressId, req.body);
    res.json(ApiResponse.success("Dirección actualizada correctamente.", address));
  });

  setDefaultAddress = asyncHandler(async (req, res) => {
    const address = await AddressService.setDefault(req.user.id, req.params.addressId);
    res.json(ApiResponse.success("Dirección predeterminada actualizada.", address));
  });

  removeAddress = asyncHandler(async (req, res) => {
    await AddressService.remove(req.user.id, req.params.addressId);
    res.json(ApiResponse.success("Dirección eliminada correctamente."));
  });

  // --- Favoritos (RF-035) ---

  listFavorites = asyncHandler(async (req, res) => {
    const favorites = await FavoriteService.list(req.user.id);
    res.json(ApiResponse.success("Favoritos obtenidos correctamente.", favorites));
  });

  addFavorite = asyncHandler(async (req, res) => {
    const favorites = await FavoriteService.add(req.user.id, req.body.productId);
    res.status(201).json(ApiResponse.success("Producto agregado a favoritos.", favorites));
  });

  removeFavorite = asyncHandler(async (req, res) => {
    const favorites = await FavoriteService.remove(req.user.id, req.params.productId);
    res.json(ApiResponse.success("Producto eliminado de favoritos.", favorites));
  });
}

export default new CustomerController();
