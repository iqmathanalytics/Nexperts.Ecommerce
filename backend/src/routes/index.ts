import { Router } from "express";
import { authRouter, adminAuthRouter } from "../modules/auth/auth.routes";
import { adminCatalogRouter, catalogRouter } from "../modules/catalog/catalog.routes";
import { cartRouter, wishlistRouter } from "../modules/cart/cart.routes";
import {
  addressRouter,
  adminOpsRouter,
  checkoutRouter,
  couponPublicRouter,
  orderRouter,
  reviewRouter,
} from "../modules/commerce.routes";
import { premiumRouter } from "../modules/premium/premium.routes";

export const api = Router();

api.use("/auth", authRouter);
// Premium routes first so /products/featured and /products/search win over /products/:slug
api.use(premiumRouter);
api.use(catalogRouter);
api.use("/cart", cartRouter);
api.use("/wishlist", wishlistRouter);
api.use("/addresses", addressRouter);
api.use("/checkout", checkoutRouter);
api.use("/orders", orderRouter);
api.use("/reviews", reviewRouter);
api.use("/coupons", couponPublicRouter);
api.use("/admin/auth", adminAuthRouter);
api.use("/admin", adminCatalogRouter);
api.use("/admin", adminOpsRouter);
