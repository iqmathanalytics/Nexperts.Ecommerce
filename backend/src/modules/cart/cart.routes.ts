import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../utils/asyncHandler";
import { success } from "../../utils/http";
import { requireCustomer } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import * as cart from "./cart.service";

export const cartRouter = Router();
cartRouter.use(requireCustomer);

cartRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    res.json(success(await cart.getCart(req.user!.id)));
  }),
);

cartRouter.post(
  "/items",
  validate(cart.cartItemSchema),
  asyncHandler(async (req, res) => {
    res.json(success(await cart.addToCart(req.user!.id, req.body)));
  }),
);

cartRouter.patch(
  "/items/:id",
  asyncHandler(async (req, res) => {
    const body = z.object({ quantity: z.number().int(), variantId: z.number().int().optional() }).parse(req.body);
    res.json(success(await cart.updateCartItem(req.user!.id, Number(req.params.id), body.quantity, body.variantId)));
  }),
);

cartRouter.delete(
  "/items/:id",
  asyncHandler(async (req, res) => {
    res.json(success(await cart.removeCartItem(req.user!.id, Number(req.params.id))));
  }),
);

cartRouter.delete(
  "/",
  asyncHandler(async (req, res) => {
    res.json(success(await cart.clearCart(req.user!.id)));
  }),
);

cartRouter.post(
  "/items/:id/wishlist",
  asyncHandler(async (req, res) => {
    res.json(success(await cart.moveCartItemToWishlist(req.user!.id, Number(req.params.id))));
  }),
);

export const wishlistRouter = Router();
wishlistRouter.use(requireCustomer);

wishlistRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    res.json(success(await cart.getWishlist(req.user!.id)));
  }),
);

wishlistRouter.post(
  "/items",
  asyncHandler(async (req, res) => {
    const body = z.object({ productId: z.number().int().positive(), variantId: z.number().int().optional() }).parse(req.body);
    res.json(success(await cart.addToWishlist(req.user!.id, body.productId, body.variantId)));
  }),
);

wishlistRouter.delete(
  "/items/:id",
  asyncHandler(async (req, res) => {
    res.json(success(await cart.removeWishlistItem(req.user!.id, Number(req.params.id))));
  }),
);

wishlistRouter.post(
  "/items/:id/cart",
  asyncHandler(async (req, res) => {
    res.json(success(await cart.moveWishlistToCart(req.user!.id, Number(req.params.id))));
  }),
);
