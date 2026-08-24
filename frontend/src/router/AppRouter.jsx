import { Routes, Route, Navigate } from "react-router-dom";

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
import Contact from "../pages/Contact/Contact";
import FAQ from "../pages/FAQ/FAQ";
import OrderTracking from "../pages/OrderTracking/OrderTracking";
import NotFound from "../pages/NotFound/NotFound";
import ProtectedRoute from "./ProtectedRoute";
import MyAccountLayout from "../pages/MyAccount/MyAccountLayout";
import Profile from "../pages/MyAccount/Profile/Profile";
import MyOrders from "../pages/MyAccount/Orders/MyOrders";
import MyOrderDetail from "../pages/MyAccount/Orders/MyOrderDetail";
import MyAddresses from "../pages/MyAccount/Addresses/MyAddresses";
import MyFavorites from "../pages/MyAccount/Favorites/MyFavorites";
import MyReviews from "../pages/MyAccount/Reviews/MyReviews";
import SeasonsList from "../pages/Seasons/SeasonsList";
import SeasonDetail from "../pages/Seasons/SeasonDetail";
import AdminRoute from "../admin/AdminRoute";
import AdminLayout from "../admin/layout/AdminLayout";
import AdminProducts from "../admin/pages/Products/AdminProducts";
import ProductForm from "../admin/pages/Products/ProductForm";
import AdminInventory from "../admin/pages/Inventory/AdminInventory";
import AdminCategories from "../admin/pages/Categories/AdminCategories";
import AdminOrders from "../admin/pages/Orders/AdminOrders";
import AdminOrderDetail from "../admin/pages/Orders/AdminOrderDetail";
import AdminUsers from "../admin/pages/Users/AdminUsers";
import AdminReviews from "../admin/pages/Reviews/AdminReviews";
import AdminPromotions from "../admin/pages/Promotions/AdminPromotions";
import AdminContent from "../admin/pages/Content/AdminContent";
import AdminDashboard from "../admin/pages/Dashboard/AdminDashboard";
import AdminSettings from "../admin/pages/Settings/AdminSettings";

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
      <Route path="/temporadas" element={<SeasonsList />} />
      <Route path="/temporadas/:slug" element={<SeasonDetail />} />
      <Route path="/personalizados" element={<ComingSoon title="Los regalos personalizados" />} />

      {/* Cuenta / carrito */}
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Register />} />
      <Route path="/recuperar-contrasena" element={<ForgotPassword />} />

      {/* Mi cuenta (RF-032 a RF-037): perfil, pedidos, direcciones,
          favoritos y opiniones, todo detrás de sesión iniciada. /favoritos
          queda como alias corto desde el ícono del Header. */}
      <Route
        path="/mi-cuenta"
        element={
          <ProtectedRoute>
            <MyAccountLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="perfil" replace />} />
        <Route path="perfil" element={<Profile />} />
        <Route path="pedidos" element={<MyOrders />} />
        <Route path="pedidos/:id" element={<MyOrderDetail />} />
        <Route path="direcciones" element={<MyAddresses />} />
        <Route path="favoritos" element={<MyFavorites />} />
        <Route path="resenas" element={<MyReviews />} />
      </Route>
      <Route path="/favoritos" element={<Navigate to="/mi-cuenta/favoritos" replace />} />
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
      <Route path="/contacto" element={<Contact />} />
      <Route path="/preguntas-frecuentes" element={<FAQ />} />
      <Route path="/envios" element={<ComingSoon title="La información de envíos" />} />
      <Route
        path="/cambios-devoluciones"
        element={<ComingSoon title="Cambios y devoluciones" />}
      />
      <Route path="/seguimiento" element={<OrderTracking />} />

      {/*
        Panel administrativo completo: Productos, Variantes, Inventario,
        Categorías, Pedidos, Usuarios, Reseñas, Promociones, Contenido,
        Dashboard y Configuración ya tienen backend y pantalla propios.
      */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="productos" element={<AdminProducts />} />
        <Route path="productos/nuevo" element={<ProductForm />} />
        <Route path="productos/:id/editar" element={<ProductForm />} />
        <Route path="inventario" element={<AdminInventory />} />
        <Route path="categorias" element={<AdminCategories />} />
        <Route path="pedidos" element={<AdminOrders />} />
        <Route path="pedidos/:id" element={<AdminOrderDetail />} />
        <Route path="usuarios" element={<AdminUsers />} />
        <Route path="resenas" element={<AdminReviews />} />
        <Route path="promociones" element={<AdminPromotions />} />
        <Route path="contenido" element={<AdminContent />} />
        <Route path="configuracion" element={<AdminSettings />} />
      </Route>

      {/* Cualquier otra ruta */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default AppRouter;
