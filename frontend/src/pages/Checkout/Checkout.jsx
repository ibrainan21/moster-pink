import { useState } from "react";
import { useNavigate, Navigate, Link } from "react-router-dom";
import { MapPin, Plus } from "lucide-react";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import useFetch from "../../hooks/useFetch";
import addressService from "../../services/address.service";
import orderService from "../../services/order.service";
import promotionService from "../../services/promotion.service";
import settingsService from "../../services/settings.service";
import { useCart } from "../../context/CartContext";
import styles from "./Checkout.module.css";

const formatPrice = (value) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(value);

const emptyAddressForm = {
  alias: "",
  recipientName: "",
  phone: "",
  street: "",
  exteriorNumber: "",
  interiorNumber: "",
  neighborhood: "",
  city: "",
  state: "",
  postalCode: "",
  country: "México",
  isDefault: false,
};

/**
 * Checkout
 * Ruta protegida /checkout. Arma el pedido final: dirección de envío
 * (RF-037, /api/customers/addresses), notas y cupón, y llama a
 * POST /api/orders/checkout (RF-030), que ya limpia el carrito en el
 * backend cuando todo sale bien.
 */
function Checkout() {
  const navigate = useNavigate();
  const { cart, refresh } = useCart();

  const {
    data: addresses,
    loading: loadingAddresses,
    error: addressesError,
  } = useFetch((signal) => addressService.list(signal), []);

  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [prevAddresses, setPrevAddresses] = useState(null);
  if (addresses && prevAddresses !== addresses) {
    setPrevAddresses(addresses);
    const defaultAddress = addresses.find((a) => a.is_default) || addresses[0];
    if (defaultAddress) setSelectedAddressId(defaultAddress.id);
  }

  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState(emptyAddressForm);
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressFormError, setAddressFormError] = useState("");

  const [notes, setNotes] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null); // { coupon, discount } | null
  const [couponError, setCouponError] = useState("");
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState("");

  const items = cart.items || [];

  // RF-030: mismo endpoint público que usa /carrito para estimar envío e
  // impuesto (ver settings.service.js). Aquí es aún más importante que en
  // el carrito, porque esta es la pantalla donde el cliente confirma el
  // pago -- el total mostrado debe coincidir con lo que el backend va a
  // cobrar de verdad.
  const { data: shippingConfig, loading: loadingShipping } = useFetch(
    (signal) => settingsService.getShippingConfig(signal),
    []
  );

  // Si el carrito está vacío no tiene sentido mostrar el checkout —
  // regresamos directo a /carrito (que ya explica el estado vacío).
  if (!items.length) {
    return <Navigate to="/carrito" replace />;
  }

  const handleCouponCodeChange = (value) => {
    setCouponCode(value);
    // Si ya había un cupón aplicado y el usuario sigue escribiendo, el
    // descuento mostrado ya no corresponde al texto actual -> se limpia
    // para no mostrar un total que no se va a respetar al confirmar.
    if (appliedCoupon) setAppliedCoupon(null);
    setCouponError("");
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponError("");
    setValidatingCoupon(true);
    try {
      const result = await promotionService.validateCoupon(couponCode.trim(), cart.total);
      setAppliedCoupon(result);
    } catch (err) {
      setAppliedCoupon(null);
      setCouponError(err.message || "No pudimos validar el cupón.");
    } finally {
      setValidatingCoupon(false);
    }
  };

  const discount = appliedCoupon?.discount || 0;

  // Igual que el backend (order.service.js checkoutFromCart): el umbral de
  // envío gratis y el impuesto se calculan sobre el subtotal SIN descuento.
  const shippingCost =
    shippingConfig && shippingConfig.freeShippingThreshold > 0 && cart.total >= shippingConfig.freeShippingThreshold
      ? 0
      : shippingConfig?.shippingCost ?? 0;
  const taxAmount = shippingConfig ? cart.total * (shippingConfig.taxRate / 100) : 0;
  const totalWithDiscount = Math.max(0, Number(cart.total) + shippingCost + taxAmount - discount);

  const handleAddressFormChange = (field, value) => {
    setAddressForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    setAddressFormError("");
    setSavingAddress(true);
    try {
      const newAddress = await addressService.create(addressForm);
      setSelectedAddressId(newAddress.id);
      setShowAddressForm(false);
      setAddressForm(emptyAddressForm);
      setPrevAddresses(null); // fuerza a que el próximo fetch la incluya
    } catch (err) {
      setAddressFormError(err.message || "No pudimos guardar la dirección.");
    } finally {
      setSavingAddress(false);
    }
  };

  const handleConfirmOrder = async () => {
    setOrderError("");

    if (!selectedAddressId) {
      setOrderError("Selecciona o agrega una dirección de envío.");
      return;
    }

    if (couponCode.trim() && !appliedCoupon) {
      setOrderError('Da clic en "Aplicar" para validar tu cupón antes de confirmar, o bórralo.');
      return;
    }

    setPlacingOrder(true);
    try {
      const result = await orderService.checkout({
        addressId: selectedAddressId,
        notes: notes || undefined,
        couponCode: couponCode || undefined,
      });
      // result = { order, paymentUrl }. El pedido ya quedó creado (PENDING)
      // y su inventario reservado antes de esto, así que perder la
      // redirección a partir de aquí (usuario cierra la pestaña, etc.) no
      // pierde el pedido — solo queda pendiente de pago hasta que vuelva
      // a intentar o un admin lo confirme manualmente.
      //
      // Si el backend no tiene MP_ACCESS_TOKEN configurado todavía,
      // paymentUrl es una URL simulada (utils/mercadoPago.js) que no
      // existe de verdad; en ese caso seguimos mandando a la
      // confirmación interna en vez de a un enlace roto.
      const isRealPaymentUrl =
        result.paymentUrl && !result.paymentUrl.includes("/checkout/stub/");

      if (isRealPaymentUrl) {
        refresh();
        window.location.href = result.paymentUrl;
        return;
      }

      navigate(`/pedido-confirmado/${result.order.id}`, { replace: true });
      refresh();
    } catch (err) {
      setOrderError(err.message || "No pudimos completar tu pedido.");
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <div>
      <Header />

      <div className={styles.page}>
        <h1 className={styles.title}>Finalizar compra</h1>

        <div className={styles.layout}>
          <div className={styles.main}>
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <MapPin size={18} /> Dirección de envío
              </h2>

              {loadingAddresses && <p className={styles.state}>Cargando direcciones...</p>}
              {addressesError && (
                <p className={styles.state}>No pudimos cargar tus direcciones.</p>
              )}

              {!loadingAddresses && addresses?.length > 0 && (
                <div className={styles.addressList}>
                  {addresses.map((addr) => (
                    <label
                      key={addr.id}
                      className={`${styles.addressCard} ${
                        selectedAddressId === addr.id ? styles.addressCardActive : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="address"
                        checked={selectedAddressId === addr.id}
                        onChange={() => setSelectedAddressId(addr.id)}
                      />
                      <div>
                        <p className={styles.addressName}>
                          {addr.alias ? `${addr.alias} — ` : ""}
                          {addr.recipient_name}
                        </p>
                        <p className={styles.addressDetail}>
                          {addr.street} {addr.exterior_number}
                          {addr.interior_number ? ` Int. ${addr.interior_number}` : ""},{" "}
                          {addr.neighborhood ? `${addr.neighborhood}, ` : ""}
                          {addr.city ? `${addr.city}, ` : ""}
                          {addr.state} {addr.postal_code}
                        </p>
                        {addr.phone && <p className={styles.addressDetail}>Tel: {addr.phone}</p>}
                      </div>
                    </label>
                  ))}
                </div>
              )}

              {!loadingAddresses && !addresses?.length && !showAddressForm && (
                <p className={styles.state}>Todavía no tienes direcciones guardadas.</p>
              )}

              {!showAddressForm && (
                <button
                  type="button"
                  className={styles.addAddressButton}
                  onClick={() => setShowAddressForm(true)}
                >
                  <Plus size={16} /> Agregar dirección
                </button>
              )}

              {showAddressForm && (
                <form className={styles.addressForm} onSubmit={handleSaveAddress}>
                  {addressFormError && <p className={styles.error}>{addressFormError}</p>}

                  <div className={styles.formRow}>
                    <input
                      type="text"
                      placeholder="Alias (ej. Casa, Oficina)"
                      value={addressForm.alias}
                      onChange={(e) => handleAddressFormChange("alias", e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Nombre de quien recibe *"
                      required
                      value={addressForm.recipientName}
                      onChange={(e) => handleAddressFormChange("recipientName", e.target.value)}
                    />
                  </div>

                  <div className={styles.formRow}>
                    <input
                      type="text"
                      placeholder="Calle *"
                      required
                      value={addressForm.street}
                      onChange={(e) => handleAddressFormChange("street", e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Número exterior"
                      value={addressForm.exteriorNumber}
                      onChange={(e) => handleAddressFormChange("exteriorNumber", e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Número interior"
                      value={addressForm.interiorNumber}
                      onChange={(e) => handleAddressFormChange("interiorNumber", e.target.value)}
                    />
                  </div>

                  <div className={styles.formRow}>
                    <input
                      type="text"
                      placeholder="Colonia"
                      value={addressForm.neighborhood}
                      onChange={(e) => handleAddressFormChange("neighborhood", e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Ciudad"
                      value={addressForm.city}
                      onChange={(e) => handleAddressFormChange("city", e.target.value)}
                    />
                  </div>

                  <div className={styles.formRow}>
                    <input
                      type="text"
                      placeholder="Estado"
                      value={addressForm.state}
                      onChange={(e) => handleAddressFormChange("state", e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Código postal"
                      value={addressForm.postalCode}
                      onChange={(e) => handleAddressFormChange("postalCode", e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Teléfono"
                      value={addressForm.phone}
                      onChange={(e) => handleAddressFormChange("phone", e.target.value)}
                    />
                  </div>

                  <div className={styles.formActions}>
                    <button type="submit" disabled={savingAddress} className={styles.saveButton}>
                      {savingAddress ? "Guardando..." : "Guardar dirección"}
                    </button>
                    <button
                      type="button"
                      className={styles.cancelButton}
                      onClick={() => setShowAddressForm(false)}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              )}
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Notas y cupón</h2>
              <textarea
                className={styles.notes}
                placeholder="Notas para tu pedido (opcional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <div className={styles.couponRow}>
                <input
                  type="text"
                  className={styles.coupon}
                  placeholder="Código de cupón (opcional)"
                  value={couponCode}
                  onChange={(e) => handleCouponCodeChange(e.target.value.toUpperCase())}
                />
                <button
                  type="button"
                  className={styles.applyCouponButton}
                  disabled={!couponCode.trim() || validatingCoupon}
                  onClick={handleApplyCoupon}
                >
                  {validatingCoupon ? "Validando..." : "Aplicar"}
                </button>
              </div>
              {couponError && <p className={styles.error}>{couponError}</p>}
              {appliedCoupon && (
                <p className={styles.couponSuccess}>
                  Cupón "{appliedCoupon.coupon.code}" aplicado: -{formatPrice(appliedCoupon.discount)}
                </p>
              )}
            </section>
          </div>

          <div className={styles.summary}>
            <h2>Resumen del pedido</h2>
            <div className={styles.summaryItems}>
              {items.map((item) => (
                <div key={item.id} className={styles.summaryItem}>
                  <span>
                    {item.quantity}× {item.product_name}
                  </span>
                  <span>{formatPrice(item.subtotal)}</span>
                </div>
              ))}
            </div>
            <div className={styles.summaryLines}>
              <div className={styles.summarySubtotal}>
                <span>Subtotal</span>
                <span>{formatPrice(cart.total)}</span>
              </div>
              <div className={styles.summarySubtotal}>
                <span>Envío</span>
                <span>
                  {loadingShipping
                    ? "Calculando..."
                    : shippingCost === 0
                    ? "Gratis"
                    : formatPrice(shippingCost)}
                </span>
              </div>
              <div className={styles.summarySubtotal}>
                <span>Impuestos</span>
                <span>{loadingShipping ? "Calculando..." : formatPrice(taxAmount)}</span>
              </div>
              {discount > 0 && (
                <div className={styles.summaryDiscount}>
                  <span>Descuento ({appliedCoupon.coupon.code})</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              )}
              <div className={styles.summaryTotal}>
                <span>Total</span>
                <span>{loadingShipping ? "Calculando..." : formatPrice(totalWithDiscount)}</span>
              </div>
            </div>

            {orderError && <p className={styles.error}>{orderError}</p>}

            <button
              type="button"
              className={styles.confirmButton}
              onClick={handleConfirmOrder}
              disabled={placingOrder || loadingShipping}
            >
              {placingOrder
                ? "Procesando..."
                : loadingShipping
                ? "Calculando total..."
                : "Confirmar pedido"}
            </button>
            <Link to="/carrito" className={styles.backLink}>
              ← Volver al carrito
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default Checkout;
