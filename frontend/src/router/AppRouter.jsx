import { Routes, Route } from "react-router-dom";

import Home from "../pages/Home/Home";
import Products from "../pages/Products/Products";
import ProductDetail from "../pages/ProductDetail/ProductDetail";
import Cart from "../pages/Cart/Cart";
import Checkout from "../pages/Checkout/Checkout";
import OrderConfirmation from "../pages/OrderConfirmation/OrderConfirmation";
import Login from "../pages/Login/Login";
import Register from "../pages/Register/Register";
import ForgotPassword from "../pages/ForgotPassword/ForgotPassword";
import ComingSoon from "../pages/ComingSoon/ComingSoon";
import NotFound from "../pages/NotFound/NotFound";
import ProtectedRoute from "./ProtectedRoute";
import AdminRoute from "../admin/AdminRoute";
import AdminLayout from "../admin/layout/AdminLayout";
import AdminProducts from "../admin/pages/Products/AdminProducts";
import ProductForm from "../admin/pages/Products/ProductForm";
import AdminInventory from "../admin/pages/Inventory/AdminInventory";

/**
 * AppRouter
 * Todas las rutas de la tienda en un solo lugar. Las páginas que todavía
 * no se construyen usan <ComingSoon /> (nunca una pantalla en blanco ni
 * contenido inventado) para que la navegación ya sea completamente
 * funcional mientras se van reemplazando una por una.
 *
 * Cuando se construya cada página real (catálogo, login, carrito, etc.),
 * solo hay que cambiar su <Route element={...}> aquí — el resto del sitio
 * no se toca.
 */
function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />

      {/* Catálogo */}
      <Route path="/productos" element={<Products />} />
      <Route path="/productos/:slug" element={<ProductDetail />} />
      <Route path="/categorias/:slug" element={<Products />} />
      <Route path="/temporadas" element={<ComingSoon title="Las temporadas" />} />
      <Route path="/temporadas/:slug" element={<ComingSoon title="Esta temporada" />} />
      <Route path="/personalizados" element={<ComingSoon title="Los regalos personalizados" />} />

      {/* Cuenta / carrito */}
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Register />} />
      <Route path="/recuperar-contrasena" element={<ForgotPassword />} />
      <Route path="/mi-cuenta" element={<ComingSoon title="Mi cuenta" />} />
      <Route path="/favoritos" element={<ComingSoon title="Tus favoritos" />} />
      <Route
        path="/carrito"
        element={
          <ProtectedRoute>
            <Cart />
          </ProtectedRoute>
        }
      />
      <Route
        path="/checkout"
        element={
          <ProtectedRoute>
            <Checkout />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pedido-confirmado/:id"
        element={
          <ProtectedRoute>
            <OrderConfirmation />
          </ProtectedRoute>
        }
      />

      {/* Información / ayuda */}
      <Route path="/contacto" element={<ComingSoon title="La página de contacto" />} />
      <Route
        path="/preguntas-frecuentes"
        element={<ComingSoon title="Las preguntas frecuentes" />}
      />
      <Route path="/envios" element={<ComingSoon title="La información de envíos" />} />
      <Route
        path="/cambios-devoluciones"
        element={<ComingSoon title="Cambios y devoluciones" />}
      />
      <Route path="/seguimiento" element={<ComingSoon title="El seguimiento de pedido" />} />

      {/*
        Panel administrativo (Fase 1: Productos, Variantes, Inventario).
        Las secciones que todavía no tienen backend propio (Dashboard real,
        Categorías, Pedidos, Usuarios, Reseñas, Promociones, Contenido,
        Configuración) quedan como ComingSoon — se reemplazan una por una
        en las siguientes fases, igual que el resto del sitio.
      */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<ComingSoon title="El dashboard administrativo" />} />
        <Route path="productos" element={<AdminProducts />} />
        <Route path="productos/nuevo" element={<ProductForm />} />
        <Route path="productos/:id/editar" element={<ProductForm />} />
        <Route path="inventario" element={<AdminInventory />} />
        <Route path="categorias" element={<ComingSoon title="Categorías y subcategorías" />} />
        <Route path="pedidos" element={<ComingSoon title="La gestión de pedidos" />} />
        <Route path="usuarios" element={<ComingSoon title="Usuarios y clientes" />} />
        <Route path="resenas" element={<ComingSoon title="La moderación de reseñas" />} />
        <Route
          path="promociones"
          element={<ComingSoon title="Temporadas, promociones y cupones" />}
        />
        <Route path="contenido" element={<ComingSoon title="Banners, galería y redes" />} />
        <Route
          path="configuracion"
          element={<ComingSoon title="La configuración de la tienda" />}
        />
      </Route>

      {/* Cualquier otra ruta */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default AppRouter;
