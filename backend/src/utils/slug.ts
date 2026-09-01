import slugify from "slugify";

export function toSlug(value: string): string {
  return slugify(value, { lower: true, strict: true, trim: true });
}

export function uniqueSuffix(): string {
  return Math.random().toString(36).slice(2, 8);
}
