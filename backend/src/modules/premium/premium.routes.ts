import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { asyncHandler } from "../../utils/asyncHandler";
import { success } from "../../utils/http";
import { requireAdmin, requireCustomer, requirePermission } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import * as premium from "./premium.service";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

export const premiumRouter = Router();

premiumRouter.get(
  "/products/featured",
  asyncHandler(async (_req, res) => {
    res.setHeader("Cache-Control", "public, max-age=30");
    res.json(success(await premium.featuredProducts()));
  }),
);

premiumRouter.get(
  "/products/search",
  asyncHandler(async (req, res) => {
    const data = await premium.facetedSearch(req.query as Record<string, unknown>);
    res.json(success(data.products, {
      facets: data.facets,
      suggestedCorrection: data.suggestedCorrection,
      page: data.page,
      limit: data.limit,
      total: data.total,
      totalPages: data.totalPages,
    }));
  }),
);

premiumRouter.post(
  "/products/visual-search",
  upload.single("image"),
  asyncHandler(async (req, res) => {
    const imageUrl = req.body?.imageUrl as string | undefined;
    res.json(success(await premium.visualSearch({ imageUrl })));
  }),
);

premiumRouter.get(
  "/products/:idOrSlug/recommendations",
  asyncHandler(async (req, res) => {
    res.json(success(await premium.recommendations(String(req.params.idOrSlug))));
  }),
);

premiumRouter.get(
  "/products/:idOrSlug/fit-data",
  asyncHandler(async (req, res) => {
    res.json(success(await premium.fitData(String(req.params.idOrSlug))));
  }),
);

premiumRouter.get(
  "/products/:idOrSlug/presence",
  asyncHandler(async (req, res) => {
    res.json(success(await premium.getPresence(String(req.params.idOrSlug))));
  }),
);

premiumRouter.post(
  "/products/:idOrSlug/presence",
  asyncHandler(async (req, res) => {
    res.json(success(await premium.bumpPresence(String(req.params.idOrSlug))));
  }),
);

premiumRouter.get(
  "/products/:idOrSlug/ugc",
  asyncHandler(async (req, res) => {
    res.json(success(await premium.listUgc(String(req.params.idOrSlug))));
  }),
);

premiumRouter.post(
  "/products/:idOrSlug/ugc",
  requireCustomer,
  validate(z.object({ imageUrl: z.string().url(), caption: z.string().max(500).optional() })),
  asyncHandler(async (req, res) => {
    res.json(success(await premium.addUgc(req.user!.id, String(req.params.idOrSlug), req.body)));
  }),
);

premiumRouter.get(
  "/designers/:slug/collection",
  asyncHandler(async (req, res) => {
    res.json(success(await premium.designerCollection(String(req.params.slug))));
  }),
);

premiumRouter.get(
  "/collections/seasonal/:season",
  asyncHandler(async (req, res) => {
    res.json(success(await premium.seasonalCollection(String(req.params.season))));
  }),
);

premiumRouter.get(
  "/lookbooks",
  asyncHandler(async (_req, res) => {
    res.setHeader("Cache-Control", "public, max-age=60");
    res.json(success(await premium.listLookbooks()));
  }),
);

premiumRouter.get(
  "/lookbooks/:slug",
  asyncHandler(async (req, res) => {
    res.json(success(await premium.getLookbook(String(req.params.slug))));
  }),
);

premiumRouter.post(
  "/style-quiz",
  requireCustomer,
  validate(premium.styleQuizSchema),
  asyncHandler(async (req, res) => {
    res.json(success(await premium.saveStyleQuiz(req.user!.id, req.body)));
  }),
);

premiumRouter.get(
  "/user/recommendations",
  requireCustomer,
  asyncHandler(async (req, res) => {
    res.json(success(await premium.userRecommendations(req.user!.id)));
  }),
);

premiumRouter.get(
  "/saved-outfits",
  requireCustomer,
  asyncHandler(async (req, res) => {
    res.json(success(await premium.listOutfits(req.user!.id)));
  }),
);

premiumRouter.post(
  "/saved-outfits",
  requireCustomer,
  validate(premium.outfitSchema),
  asyncHandler(async (req, res) => {
    res.status(201).json(success(await premium.createOutfit(req.user!.id, req.body)));
  }),
);

premiumRouter.get(
  "/loyalty",
  requireCustomer,
  asyncHandler(async (req, res) => {
    res.json(success(await premium.getLoyalty(req.user!.id)));
  }),
);

premiumRouter.post(
  "/loyalty/redeem",
  requireCustomer,
  validate(z.object({ points: z.number().int().positive() })),
  asyncHandler(async (req, res) => {
    res.json(success(await premium.redeemLoyalty(req.user!.id, req.body.points)));
  }),
);

premiumRouter.post(
  "/shipping-estimate",
  validate(z.object({ pincode: z.string().min(4), items: z.array(z.unknown()).optional() })),
  asyncHandler(async (req, res) => {
    res.json(success(await premium.shippingEstimate(req.body.pincode)));
  }),
);

premiumRouter.get(
  "/orders/:id/tracking",
  requireCustomer,
  asyncHandler(async (req, res) => {
    res.json(success(await premium.orderTracking(req.user!.id, Number(req.params.id))));
  }),
);

premiumRouter.post(
  "/webhooks/tracking",
  validate(z.object({ orderId: z.number(), status: z.string(), message: z.string().optional() })),
  asyncHandler(async (req, res) => {
    res.json(success(await premium.trackingWebhook(req.body)));
  }),
);

premiumRouter.post(
  "/waitlist",
  validate(z.object({ variantId: z.number(), email: z.string().email(), phone: z.string().optional() })),
  asyncHandler(async (req, res) => {
    res.json(success(await premium.joinWaitlist(req.body)));
  }),
);

premiumRouter.get(
  "/referrals/me",
  requireCustomer,
  asyncHandler(async (req, res) => {
    res.json(success(await premium.myReferral(req.user!.id)));
  }),
);

premiumRouter.post(
  "/referrals/claim",
  requireCustomer,
  validate(z.object({ code: z.string().min(3) })),
  asyncHandler(async (req, res) => {
    res.json(success(await premium.claimReferral(req.user!.id, req.body.code)));
  }),
);

premiumRouter.get(
  "/privacy/export",
  requireCustomer,
  asyncHandler(async (req, res) => {
    res.json(success(await premium.privacyExport(req.user!.id)));
  }),
);

premiumRouter.post(
  "/privacy/delete",
  requireCustomer,
  asyncHandler(async (req, res) => {
    res.json(success(await premium.privacyDelete(req.user!.id)));
  }),
);

premiumRouter.post(
  "/privacy/consent",
  requireCustomer,
  validate(z.object({ type: z.string(), granted: z.boolean() })),
  asyncHandler(async (req, res) => {
    res.json(success(await premium.saveConsent(req.user!.id, req.body.type, req.body.granted)));
  }),
);

premiumRouter.post(
  "/cart/merge",
  requireCustomer,
  validate(
    z.object({
      items: z.array(z.object({ variantId: z.number(), quantity: z.number().int().positive() })),
    }),
  ),
  asyncHandler(async (req, res) => {
    res.json(success(await premium.mergeCart(req.user!.id, req.body.items)));
  }),
);

premiumRouter.post(
  "/support/faq-chat",
  validate(z.object({ question: z.string().min(2) })),
  asyncHandler(async (req, res) => {
    res.json(success(await premium.faqChat(req.body.question)));
  }),
);

premiumRouter.get(
  "/admin/analytics/premium",
  requireAdmin,
  requirePermission("analytics.read"),
  asyncHandler(async (_req, res) => {
    res.json(success(await premium.premiumAnalytics()));
  }),
);
