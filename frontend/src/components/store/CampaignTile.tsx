"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

export function CampaignTile({
  href,
  image,
  label,
  title,
  cta,
  tall,
}: {
  href: string;
  image: string;
  label: string;
  title: string;
  cta: string;
  tall?: boolean;
}) {
  return (
    <Link href={href} className={`group relative overflow-hidden bg-surface-muted ${tall ? "min-h-[78vh]" : "flex min-h-[62vh]"}`}>
      <motion.div className="absolute inset-0" whileHover={{ scale: 1.06 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
        <Image
          src={image}
          alt={title}
          fill
          quality={70}
          sizes={tall ? "(max-width:768px) 100vw, 50vw" : "100vw"}
          className="object-cover object-[center_18%]"
        />
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent transition duration-500 group-hover:from-black/70" />
      <div className="absolute inset-x-0 bottom-0 p-7 md:p-12">
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/75">{label}</p>
        <p className="mt-2 font-display text-4xl font-semibold text-white md:text-5xl">{title}</p>
        <span className="mt-5 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white">
          {cta}
          <span className="inline-block translate-x-0 transition duration-300 group-hover:translate-x-1.5">→</span>
        </span>
      </div>
    </Link>
  );
}
