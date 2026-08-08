import ApiError from "../../utils/ApiError.js";
import PurchaseRepository from "./purchase.repository.js";
import SupplierRepository from "../suppliers/supplier.repository.js";
import ProductRepository from "../products/product.repository.js";

class PurchaseService {
  async list(query) {
    const { page = 1, limit = 20, supplierId, status, dateFrom, dateTo } = query;
    return PurchaseRepository.list({
      page,
      limit,
      supplierId: supplierId || null,
      status: status || null,
      dateFrom: dateFrom || null,
      dateTo: dateTo || null,
    });
  }

  async getFullPurchase(purchase) {
    const [details, payments, returns] = await Promise.all([
      PurchaseRepository.getDetails(purchase.id),
      PurchaseRepository.getPayments(purchase.id),
      PurchaseRepository.getReturns(purchase.id),
    ]);
    const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    return { ...purchase, details, payments, returns, totalPaid, balance: Number(purchase.total) - totalPaid };
  }

  async getById(id) {
    const purchase = await PurchaseRepository.getById(id);
    if (!purchase) throw new ApiError(404, "Compra no encontrada.");
    return this.getFullPurchase(purchase);
  }

  // RF-026: generar orden de compra.
  async create(data, actingUser) {
    const supplier = await SupplierRepository.getById(data.supplierId);
    if (!supplier) throw new ApiError(400, "El proveedor especificado no existe.");

    if (!data.lines || !data.lines.length) {
      throw new ApiError(400, "La compra debe tener al menos un producto.");
    }

    for (const line of data.lines) {
      const variant = await ProductRepository.getVariantById(line.variantId);
      if (!variant) {
        throw new ApiError(400, `La variante con id ${line.variantId} no existe.`);
      }

      const warehouseOk = await PurchaseRepository.warehouseExists(line.warehouseId);
      if (!warehouseOk) {
        throw new ApiError(400, `El almacén con id ${line.warehouseId} no existe.`);
      }
    }

    const purchaseId = await PurchaseRepository.create({
      supplierId: data.supplierId,
      purchaseDate: data.purchaseDate || new Date(),
      notes: data.notes,
      createdBy: actingUser.id,
      lines: data.lines,
    });

    return this.getById(purchaseId);
  }

  // RF-027, RN-023: confirmar recepción de mercancía.
  async markReceived(id, actingUser) {
    const purchase = await PurchaseRepository.getById(id);
    if (!purchase) throw new ApiError(404, "Compra no encontrada.");

    if (purchase.status === "RECEIVED") {
      throw new ApiError(400, "Esta compra ya fue marcada como recibida.");
    }
    if (purchase.status === "CANCELLED") {
      throw new ApiError(400, "No se puede recibir una compra cancelada.");
    }

    await PurchaseRepository.markReceived(id, actingUser.id);
    return this.getById(id);
  }

  async cancel(id) {
    const purchase = await PurchaseRepository.getById(id);
    if (!purchase) throw new ApiError(404, "Compra no encontrada.");

    if (purchase.status === "RECEIVED") {
      throw new ApiError(
        400,
        "No se puede cancelar una compra ya recibida; usa una devolución en su lugar."
      );
    }

    await PurchaseRepository.cancel(id);
    return this.getById(id);
  }

  async addPayment(purchaseId, data) {
    const purchase = await PurchaseRepository.getById(purchaseId);
    if (!purchase) throw new ApiError(404, "Compra no encontrada.");

    const totalPaid = await PurchaseRepository.getTotalPaid(purchaseId);
    const remaining = Number(purchase.total) - totalPaid;

    if (data.amount > remaining) {
      throw new ApiError(
        400,
        `El monto excede el saldo pendiente. Saldo actual: ${remaining.toFixed(2)}.`
      );
    }

    return PurchaseRepository.addPayment(purchaseId, data);
  }

  // Devolución al proveedor: solo tiene sentido sobre mercancía ya recibida.
  async createReturn(purchaseId, data) {
    const purchase = await PurchaseRepository.getById(purchaseId);
    if (!purchase) throw new ApiError(404, "Compra no encontrada.");

    if (purchase.status !== "RECEIVED") {
      throw new ApiError(400, "Solo se pueden devolver compras que ya fueron recibidas.");
    }

    if (!data.lines || !data.lines.length) {
      throw new ApiError(400, "La devolución debe tener al menos un producto.");
    }

    const returnId = await PurchaseRepository.createReturn({
      purchaseId,
      reason: data.reason,
      lines: data.lines,
    });

    return this.getById(purchaseId).then((p) => ({
      purchase: p,
      returnId,
    }));
  }
}

export default new PurchaseService();
