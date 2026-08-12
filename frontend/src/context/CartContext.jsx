import { createContext, useContext, useState } from "react";
import cartService from "../services/cart.service";
import { useAuth } from "./AuthContext";

/**
 * CartContext
 * Fuente única de verdad del carrito en todo el frontend. El backend no
 * tiene carrito de invitado (todo /api/cart requiere sesión, ver
 * cart.routes.js), así que aquí solo se llama a la API cuando hay un
 * usuario autenticado; sin sesión, el carrito simplemente se ve vacío y
 * las acciones piden iniciar sesión primero.
 */
const CartContext = createContext(null);

const emptyCart = { items: [], total: 0, itemCount: 0 };

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState(emptyCart);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Trae el carrito del backend. Se llama de forma perezosa (la primera
  // vez que algo lo necesita) en vez de en un efecto global, para no
  // disparar la petición antes de saber si hay sesión.
  const refresh = async () => {
    if (!isAuthenticated) {
      setCart(emptyCart);
      setLoaded(true);
      return emptyCart;
    }
    setLoading(true);
    try {
      const data = await cartService.get();
      setCart(data);
      setLoaded(true);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const ensureLoaded = async () => {
    if (!loaded && isAuthenticated) await refresh();
  };

  const addItem = async (variantId, quantity = 1) => {
    const data = await cartService.addItem(variantId, quantity);
    setCart(data);
    setLoaded(true);
    return data;
  };

  const updateQuantity = async (itemId, quantity) => {
    const data = await cartService.updateQuantity(itemId, quantity);
    setCart(data);
    return data;
  };

  const removeItem = async (itemId) => {
    const data = await cartService.removeItem(itemId);
    setCart(data);
    return data;
  };

  const clear = async () => {
    const data = await cartService.clear();
    setCart(data);
    return data;
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        loaded,
        refresh,
        ensureLoaded,
        addItem,
        updateQuantity,
        removeItem,
        clear,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart() debe usarse dentro de <CartProvider>.");
  }
  return context;
}
