"use client";

import { Suspense } from "react";
import { CatalogInner } from "@/components/store/Catalog";
import { Spinner } from "@/components/ui/state";

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-24"><Spinner /></div>}>
      <CatalogInner />
    </Suspense>
  );
}
