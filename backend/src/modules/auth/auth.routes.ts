import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { success } from "../../utils/http";
import { clearAuthCookie, optionalCustomer, requireAdmin, requireCustomer, setAuthCookie } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import * as auth from "./auth.service";

export const authRouter = Router();

authRouter.post(
  "/register",
  validate(auth.registerSchema),
  asyncHandler(async (req, res) => {
    const session = await auth.registerCustomer(req.body);
    setAuthCookie(res, "customer", session.token);
    res.status(201).json(success({ user: session.user }));
  }),
);

authRouter.post(
  "/login",
  validate(auth.loginSchema),
  asyncHandler(async (req, res) => {
    const session = await auth.login(req.body, "customer");
    setAuthCookie(res, "customer", session.token);
    res.json(success({ user: session.user }));
  }),
);

authRouter.post(
  "/logout",
  asyncHandler(async (_req, res) => {
    clearAuthCookie(res, "customer");
    res.json(success({ ok: true }));
  }),
);

authRouter.post(
  "/forgot-password",
  validate(auth.forgotSchema),
  asyncHandler(async (req, res) => {
    await auth.forgotPassword(req.body.email);
    res.json(success({ ok: true }));
  }),
);

authRouter.post(
  "/reset-password",
  validate(auth.resetSchema),
  asyncHandler(async (req, res) => {
    await auth.resetPassword(req.body.token, req.body.password);
    res.json(success({ ok: true }));
  }),
);

authRouter.get(
  "/me",
  optionalCustomer,
  asyncHandler(async (req, res) => {
    if (!req.user) {
      res.json(success({ user: null }));
      return;
    }
    const user = await auth.getMe(req.user.id);
    res.json(success({ user }));
  }),
);

authRouter.patch(
  "/me",
  requireCustomer,
  validate(auth.updateProfileSchema),
  asyncHandler(async (req, res) => {
    const user = await auth.updateProfile(req.user!.id, req.body);
    res.json(success({ user }));
  }),
);

authRouter.post(
  "/me/password",
  requireCustomer,
  validate(auth.changePasswordSchema),
  asyncHandler(async (req, res) => {
    await auth.changePassword(req.user!.id, req.body);
    res.json(success({ ok: true }));
  }),
);

export const adminAuthRouter = Router();

adminAuthRouter.post(
  "/login",
  validate(auth.loginSchema),
  asyncHandler(async (req, res) => {
    const session = await auth.login(req.body, "admin", req.ip);
    setAuthCookie(res, "admin", session.token);
    res.json(success({ user: session.user, permissions: session.permissions }));
  }),
);

adminAuthRouter.post(
  "/logout",
  asyncHandler(async (_req, res) => {
    clearAuthCookie(res, "admin");
    res.json(success({ ok: true }));
  }),
);

adminAuthRouter.get(
  "/me",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const user = await auth.getMe(req.user!.id);
    res.json(success({ user }));
  }),
);
