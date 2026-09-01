"use client";

import { Suspense } from "react";
import { OrdersList } from "@/components/admin/OrdersList";

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={null}>
      <OrdersList title="Orders" />
    </Suspense>
  );
}
