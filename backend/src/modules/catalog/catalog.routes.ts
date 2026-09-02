import { Router } from "express";
import multer from "multer";
import { asyncHandler } from "../../utils/asyncHandler";
import { success } from "../../utils/http";
import { requireAdmin, requirePermission } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import * as catalog from "./catalog.service";
import * as adminCatalog from "./adminCatalog.service";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 8 } });

export const catalogRouter = Router();

catalogRouter.get(
  "/products",
  asyncHandler(async (req, res) => {
    const data = await catalog.listProducts(catalog.productQuerySchema.parse(req.query));
    res.setHeader("Cache-Control", "public, max-age=30");
    res.json(success(data.items, { page: data.page, limit: data.limit, total: data.total, totalPages: data.totalPages }));
  }),
);

catalogRouter.get(
  "/products/search/suggest",
  asyncHandler(async (req, res) => {
    const q = String(req.query.q ?? "");
    res.json(success(await catalog.searchSuggest(q)));
  }),
);

catalogRouter.get(
  "/products/:slug",
  asyncHandler(async (req, res) => {
    res.json(success(await catalog.getProductBySlug(String(req.params.slug))));
  }),
);

catalogRouter.get(
  "/categories",
  asyncHandler(async (_req, res) => {
    res.setHeader("Cache-Control", "public, max-age=300");
    res.json(success(await catalog.listCategoriesTree()));
  }),
);

catalogRouter.get(
  "/categories/:slug",
  asyncHandler(async (req, res) => {
    res.json(success(await catalog.getCategoryBySlug(String(req.params.slug))));
  }),
);

catalogRouter.get(
  "/brands",
  asyncHandler(async (_req, res) => {
    res.json(success(await catalog.listBrands()));
  }),
);

catalogRouter.get(
  "/home",
  asyncHandler(async (_req, res) => {
    res.json(success(await catalog.homepageData()));
  }),
);

export const adminCatalogRouter = Router();
adminCatalogRouter.use(requireAdmin);

adminCatalogRouter.get(
  "/products",
  requirePermission("product.read"),
  asyncHandler(async (req, res) => {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);
    const data = await adminCatalog.adminListProducts(String(req.query.q ?? ""), String(req.query.status ?? ""), page, limit);
    res.json(success(data.items, { page: data.page, limit: data.limit, total: data.total }));
  }),
);

adminCatalogRouter.get(
  "/products/:id",
  requirePermission("product.read"),
  asyncHandler(async (req, res) => {
    res.json(success(await adminCatalog.adminGetProduct(Number(req.params.id))));
  }),
);

adminCatalogRouter.post(
  "/products",
  requirePermission("product.create"),
  validate(adminCatalog.upsertProductSchema),
  asyncHandler(async (req, res) => {
    res.status(201).json(success(await adminCatalog.createProduct(req.user!.id, req.body, req.ip)));
  }),
);

adminCatalogRouter.put(
  "/products/:id",
  requirePermission("product.update"),
  validate(adminCatalog.upsertProductSchema),
  asyncHandler(async (req, res) => {
    res.json(success(await adminCatalog.updateProduct(req.user!.id, Number(req.params.id), req.body, req.ip)));
  }),
);

adminCatalogRouter.delete(
  "/products/:id",
  requirePermission("product.delete"),
  asyncHandler(async (req, res) => {
    await adminCatalog.archiveProduct(req.user!.id, Number(req.params.id), req.ip);
    res.json(success({ ok: true }));
  }),
);

adminCatalogRouter.post(
  "/products/:id/status",
  requirePermission("product.update"),
  asyncHandler(async (req, res) => {
    await adminCatalog.setProductStatus(req.user!.id, Number(req.params.id), req.body.status);
    res.json(success({ ok: true }));
  }),
);

adminCatalogRouter.post(
  "/products/:id/images",
  requirePermission("product.update"),
  upload.array("images", 8),
  asyncHandler(async (req, res) => {
    const files = (req.files as Express.Multer.File[]) ?? [];
    res.json(success(await adminCatalog.addProductImages(req.user!.id, Number(req.params.id), files)));
  }),
);

adminCatalogRouter.delete(
  "/images/:id",
  requirePermission("product.update"),
  asyncHandler(async (req, res) => {
    await adminCatalog.deleteProductImage(req.user!.id, Number(req.params.id));
    res.json(success({ ok: true }));
  }),
);

adminCatalogRouter.post(
  "/images/:id/primary",
  requirePermission("product.update"),
  asyncHandler(async (req, res) => {
    await adminCatalog.setPrimaryImage(req.user!.id, Number(req.params.id));
    res.json(success({ ok: true }));
  }),
);

adminCatalogRouter.post(
  "/products/:id/images/reorder",
  requirePermission("product.update"),
  asyncHandler(async (req, res) => {
    await adminCatalog.reorderImages(req.user!.id, Number(req.params.id), req.body.orderedIds);
    res.json(success({ ok: true }));
  }),
);

adminCatalogRouter.get(
  "/categories",
  requirePermission("category.manage"),
  asyncHandler(async (_req, res) => {
    res.json(success(await adminCatalog.listCategoriesAdmin()));
  }),
);

adminCatalogRouter.post(
  "/categories",
  requirePermission("category.manage"),
  validate(adminCatalog.categorySchema),
  asyncHandler(async (req, res) => {
    res.status(201).json(success(await adminCatalog.createCategory(req.user!.id, req.body)));
  }),
);

adminCatalogRouter.put(
  "/categories/:id",
  requirePermission("category.manage"),
  validate(adminCatalog.categorySchema),
  asyncHandler(async (req, res) => {
    await adminCatalog.updateCategory(req.user!.id, Number(req.params.id), req.body);
    res.json(success({ ok: true }));
  }),
);

adminCatalogRouter.delete(
  "/categories/:id",
  requirePermission("category.manage"),
  asyncHandler(async (req, res) => {
    await adminCatalog.archiveCategory(req.user!.id, Number(req.params.id));
    res.json(success({ ok: true }));
  }),
);

adminCatalogRouter.get(
  "/brands",
  requirePermission("brand.manage"),
  asyncHandler(async (_req, res) => {
    res.json(success(await adminCatalog.listBrandsAdmin()));
  }),
);

adminCatalogRouter.post(
  "/brands",
  requirePermission("brand.manage"),
  validate(adminCatalog.brandSchema),
  asyncHandler(async (req, res) => {
    res.status(201).json(success(await adminCatalog.createBrand(req.user!.id, req.body)));
  }),
);

adminCatalogRouter.put(
  "/brands/:id",
  requirePermission("brand.manage"),
  validate(adminCatalog.brandSchema),
  asyncHandler(async (req, res) => {
    await adminCatalog.updateBrand(req.user!.id, Number(req.params.id), req.body);
    res.json(success({ ok: true }));
  }),
);

adminCatalogRouter.delete(
  "/brands/:id",
  requirePermission("brand.manage"),
  asyncHandler(async (req, res) => {
    await adminCatalog.archiveBrand(req.user!.id, Number(req.params.id));
    res.json(success({ ok: true }));
  }),
);

adminCatalogRouter.post(
  "/brands/:id/logo",
  requirePermission("brand.manage"),
  upload.single("logo"),
  asyncHandler(async (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, error: { code: "NO_FILE", message: "Logo required" } });
    const { uploadImage } = await import("../../utils/storage");
    const stored = await uploadImage(req.file, "brands");
    await adminCatalog.updateBrandLogo(req.user!.id, Number(req.params.id), stored.url);
    res.json(success(stored));
  }),
);
