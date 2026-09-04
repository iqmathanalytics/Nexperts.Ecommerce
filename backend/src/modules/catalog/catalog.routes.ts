import { Router } from "express";
import multer from "multer";
import { asyncHandler } from "../../utils/asyncHandler";
import { success } from "../../utils/http";
import { requireAdmin, requirePermission } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { uploadImage } from "../../utils/storage";
import * as catalog from "./catalog.service";
import * as adminCatalog from "./adminCatalog.service";
import * as adminMerch from "./adminMerch.service";

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
    const lite = req.query.lite === "1" || req.query.lite === "true";
    res.setHeader("Cache-Control", lite ? "public, max-age=45" : "public, max-age=20, stale-while-revalidate=120");
    res.json(success(await catalog.getProductBySlug(String(req.params.slug), { lite })));
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
    res.setHeader("Cache-Control", "public, max-age=300");
    res.json(success(await catalog.listBrands()));
  }),
);

catalogRouter.get(
  "/home",
  asyncHandler(async (_req, res) => {
    res.setHeader("Cache-Control", "public, max-age=90, stale-while-revalidate=600");
    res.json(success(await catalog.homepageData()));
  }),
);

catalogRouter.get(
  "/editorial",
  asyncHandler(async (_req, res) => {
    res.setHeader("Cache-Control", "public, max-age=90, stale-while-revalidate=600");
    res.json(success(await adminMerch.getEditorial()));
  }),
);

catalogRouter.get(
  "/commerce",
  asyncHandler(async (_req, res) => {
    res.setHeader("Cache-Control", "public, max-age=60");
    res.json(success(catalog.storefrontCommerce()));
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
  "/products/:id/duplicate",
  requirePermission("product.create"),
  asyncHandler(async (req, res) => {
    res.status(201).json(success(await adminCatalog.duplicateProduct(req.user!.id, Number(req.params.id), req.ip)));
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

adminCatalogRouter.patch(
  "/images/:id",
  requirePermission("product.update"),
  validate(adminCatalog.imageMetaSchema),
  asyncHandler(async (req, res) => {
    res.json(success(await adminCatalog.updateImageMeta(req.user!.id, Number(req.params.id), req.body)));
  }),
);

adminCatalogRouter.post(
  "/media",
  requireAdmin,
  upload.single("image"),
  asyncHandler(async (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, error: { code: "NO_FILE", message: "Image required" } });
    const folder = ["products", "categories", "brands", "collections", "lookbooks", "merch"].includes(String(req.body.folder))
      ? String(req.body.folder)
      : "merch";
    res.json(success(await uploadImage(req.file, folder)));
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

adminCatalogRouter.post(
  "/categories/:id/restore",
  requirePermission("category.manage"),
  asyncHandler(async (req, res) => {
    await adminCatalog.restoreCategory(req.user!.id, Number(req.params.id));
    res.json(success({ ok: true }));
  }),
);

adminCatalogRouter.post(
  "/categories/:id/image",
  requirePermission("category.manage"),
  upload.single("image"),
  asyncHandler(async (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, error: { code: "NO_FILE", message: "Image required" } });
    const stored = await uploadImage(req.file, "categories");
    await adminCatalog.updateCategoryImage(req.user!.id, Number(req.params.id), stored.url);
    res.json(success(stored));
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
    const stored = await uploadImage(req.file, "brands");
    await adminCatalog.updateBrandLogo(req.user!.id, Number(req.params.id), stored.url);
    res.json(success(stored));
  }),
);

adminCatalogRouter.post(
  "/brands/:id/hero",
  requirePermission("brand.manage"),
  upload.single("image"),
  asyncHandler(async (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, error: { code: "NO_FILE", message: "Image required" } });
    const stored = await uploadImage(req.file, "brands");
    await adminCatalog.updateBrandHero(req.user!.id, Number(req.params.id), stored.url);
    res.json(success(stored));
  }),
);

adminCatalogRouter.post(
  "/brands/:id/restore",
  requirePermission("brand.manage"),
  asyncHandler(async (req, res) => {
    await adminCatalog.restoreBrand(req.user!.id, Number(req.params.id));
    res.json(success({ ok: true }));
  }),
);

adminCatalogRouter.get(
  "/editorial",
  requirePermission("settings.manage"),
  asyncHandler(async (_req, res) => {
    res.json(success(await adminMerch.getEditorial()));
  }),
);

adminCatalogRouter.put(
  "/editorial",
  requirePermission("settings.manage"),
  validate(adminMerch.editorialSchema),
  asyncHandler(async (req, res) => {
    res.json(success(await adminMerch.saveEditorial(req.user!.id, req.body)));
  }),
);

adminCatalogRouter.get(
  "/collections",
  requirePermission("category.manage"),
  asyncHandler(async (_req, res) => {
    res.json(success(await adminMerch.listCollectionsAdmin()));
  }),
);

adminCatalogRouter.get(
  "/collections/:id",
  requirePermission("category.manage"),
  asyncHandler(async (req, res) => {
    res.json(success(await adminMerch.getCollectionAdmin(Number(req.params.id))));
  }),
);

adminCatalogRouter.post(
  "/collections",
  requirePermission("category.manage"),
  validate(adminMerch.collectionSchema),
  asyncHandler(async (req, res) => {
    res.status(201).json(success(await adminMerch.createCollection(req.user!.id, req.body)));
  }),
);

adminCatalogRouter.put(
  "/collections/:id",
  requirePermission("category.manage"),
  validate(adminMerch.collectionSchema),
  asyncHandler(async (req, res) => {
    res.json(success(await adminMerch.updateCollection(req.user!.id, Number(req.params.id), req.body)));
  }),
);

adminCatalogRouter.delete(
  "/collections/:id",
  requirePermission("category.manage"),
  asyncHandler(async (req, res) => {
    await adminMerch.archiveCollection(req.user!.id, Number(req.params.id));
    res.json(success({ ok: true }));
  }),
);

adminCatalogRouter.get(
  "/lookbooks",
  requirePermission("brand.manage"),
  asyncHandler(async (_req, res) => {
    res.json(success(await adminMerch.listLookbooksAdmin()));
  }),
);

adminCatalogRouter.get(
  "/lookbooks/:id",
  requirePermission("brand.manage"),
  asyncHandler(async (req, res) => {
    res.json(success(await adminMerch.getLookbookAdmin(Number(req.params.id))));
  }),
);

adminCatalogRouter.post(
  "/lookbooks",
  requirePermission("brand.manage"),
  validate(adminMerch.lookbookSchema),
  asyncHandler(async (req, res) => {
    res.status(201).json(success(await adminMerch.createLookbook(req.user!.id, req.body)));
  }),
);

adminCatalogRouter.put(
  "/lookbooks/:id",
  requirePermission("brand.manage"),
  validate(adminMerch.lookbookSchema),
  asyncHandler(async (req, res) => {
    res.json(success(await adminMerch.updateLookbook(req.user!.id, Number(req.params.id), req.body)));
  }),
);

adminCatalogRouter.delete(
  "/lookbooks/:id",
  requirePermission("brand.manage"),
  asyncHandler(async (req, res) => {
    await adminMerch.archiveLookbook(req.user!.id, Number(req.params.id));
    res.json(success({ ok: true }));
  }),
);
