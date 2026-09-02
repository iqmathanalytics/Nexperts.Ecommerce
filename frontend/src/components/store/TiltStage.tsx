"use client";

import type { ReactNode } from "react";

export function TiltStage({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
  intensity?: number;
}) {
  return <div className={className}>{children}</div>;
}
