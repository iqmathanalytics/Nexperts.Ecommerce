type Entry<T> = { value: T; expires: number };

const store = new Map<string, Entry<unknown>>();

export function cacheGet<T>(key: string): T | undefined {
  const hit = store.get(key) as Entry<T> | undefined;
  if (!hit) return undefined;
  if (Date.now() > hit.expires) {
    store.delete(key);
    return undefined;
  }
  return hit.value;
}

const MAX_ENTRIES = 800;

export function cacheSet<T>(key: string, value: T, ttlMs: number) {
  if (store.size >= MAX_ENTRIES) {
    const now = Date.now();
    for (const [k, entry] of store) {
      if (now > entry.expires) store.delete(k);
    }
    if (store.size >= MAX_ENTRIES) {
      const first = store.keys().next().value;
      if (first) store.delete(first);
    }
  }
  store.set(key, { value, expires: Date.now() + ttlMs });
}

export function cacheDel(key: string) {
  store.delete(key);
}

export function invalidateStorefrontCache() {
  cacheDel("editorial");
  cacheDel("homepage");
  cacheDel("categories");
  cacheDel("brands");
  for (const key of [...store.keys()]) {
    if (key.startsWith("product:") || key.startsWith("products:")) store.delete(key);
  }
}
