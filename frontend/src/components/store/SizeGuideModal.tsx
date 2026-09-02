"use client";

import { Modal } from "@/components/ui/modal";

const CHART: Array<{ size: string; bust: string; waist: string; hip: string }> = [
  { size: "XS", bust: "32", waist: "24", hip: "34" },
  { size: "S", bust: "34", waist: "26", hip: "36" },
  { size: "M", bust: "36", waist: "28", hip: "38" },
  { size: "L", bust: "38", waist: "30", hip: "40" },
  { size: "XL", bust: "40", waist: "32", hip: "42" },
];

export function SizeGuideModal({
  open,
  onClose,
  brandName,
  fitHint,
}: {
  open: boolean;
  onClose: () => void;
  brandName?: string | null;
  fitHint?: string | null;
}) {
  return (
    <Modal open={open} onClose={onClose} title="Size guide" size="lg">
      <p className="text-sm text-muted">
        {brandName ? `${brandName} sizing` : "Brand sizing"} — measurements in inches. Prefer a relaxed fit? Size up.
      </p>
      {fitHint ? <p className="mt-3 text-sm font-medium text-ink">{fitHint}</p> : null}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[28rem] text-left text-sm">
          <thead>
            <tr className="border-b border-line text-[11px] uppercase tracking-[0.16em] text-muted">
              <th className="py-3 pr-4 font-semibold">Size</th>
              <th className="py-3 pr-4 font-semibold">Bust</th>
              <th className="py-3 pr-4 font-semibold">Waist</th>
              <th className="py-3 font-semibold">Hip</th>
            </tr>
          </thead>
          <tbody>
            {CHART.map((row) => (
              <tr key={row.size} className="border-b border-line/70">
                <td className="py-3 pr-4 font-semibold">{row.size}</td>
                <td className="py-3 pr-4">{row.bust}</td>
                <td className="py-3 pr-4">{row.waist}</td>
                <td className="py-3">{row.hip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-6 text-xs leading-relaxed text-muted">
        Fit predictor: if past purchases ran small, choose one size up. Complete the style quiz for personalized sizing.
      </p>
    </Modal>
  );
}
