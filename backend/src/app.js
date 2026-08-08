import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";

import authRoutes from "./modules/auth/auth.routes.js";
import userRoutes from "./modules/users/user.routes.js";
import categoryRoutes from "./modules/categories/category.routes.js";
import productRoutes from "./modules/products/product.routes.js";
import supplierRoutes from "./modules/suppliers/supplier.routes.js";
import purchaseRoutes from "./modules/purchases/purchase.routes.js";
import inventoryRoutes from "./modules/inventory/inventory.routes.js";
import cartRoutes from "./modules/cart/cart.routes.js";
import orderRoutes from "./modules/orders/order.routes.js";
import customerRoutes from "./modules/customers/customer.routes.js";
import reviewRoutes from "./modules/reviews/review.routes.js";
import promotionRoutes from "./modules/promotions/promotion.routes.js";
import contentRoutes from "./modules/content/content.routes.js";
import aiRoutes from "./modules/ai/ai.routes.js";
import errorMiddleware from "./middlewares/error.middleware.js";
import ApiError from "./utils/ApiError.js";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "*",
    credentials: true,
  })
);
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "🚀 Moster Pink API funcionando correctamente",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/promotions", promotionRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/ai", aiRoutes);

// Cualquier ruta no reconocida.
app.use((req, res, next) => {
  next(new ApiError(404, `La ruta ${req.originalUrl} no existe.`));
});

app.use(errorMiddleware);

export default app;
