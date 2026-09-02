"use client";

import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

export type CampaignHeroAction = {
  href: string;
  label: string;
  variant?: "solid" | "outline";
};

export type CampaignHeroLink = { href: string; label: string };

export type CampaignHeroVideo = {
  src: string;
  poster: string;
  alt: string;
};

function FilmPane({
  video,
  reduceMotion,
  fallbackImage,
  eager,
}: {
  video: CampaignHeroVideo;
  reduceMotion: boolean;
  fallbackImage?: string;
  eager?: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const still = fallbackImage || video.poster;

  useEffect(() => {
    const el = ref.current;
    if (!el || reduceMotion) return;
    el.muted = true;
    const play = () => el.play().catch(() => undefined);
    play();
    const onVisible = () => {
      if (document.visibilityState === "visible") play();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [reduceMotion, video.src]);

  return (
    <div className="hero-film">
      {reduceMotion ? (
        <div
          className="absolute inset-0 bg-cover bg-[center_22%] md:bg-center"
          style={{ backgroundImage: `url(${still})` }}
          role="img"
          aria-label={video.alt}
        />
      ) : (
        <video
          ref={ref}
          className="hero-film-media"
          autoPlay
          muted
          loop
          playsInline
          preload={eager ? "metadata" : "none"}
          poster={video.poster}
          aria-label={video.alt}
        >
          <source src={video.src} type="video/mp4" />
        </video>
      )}
    </div>
  );
}

export function CampaignHero({
  video,
  videos,
  image,
  kicker,
  title,
  subtitle,
  actions,
  links,
  children,
}: {
  video?: CampaignHeroVideo;
  videos?: CampaignHeroVideo[];
  image?: string;
  kicker: string;
  title: string;
  subtitle?: string;
  actions: CampaignHeroAction[];
  links?: CampaignHeroLink[];
  children?: ReactNode;
}) {
  const [reduceMotion, setReduceMotion] = useState(false);
  const films = videos?.length ? videos : video ? [video] : [];
  const split = films.length > 1;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const lines = title.split("\n");
  const still = image || films[0]?.poster;

  return (
    <section className="hero-stage relative bg-brand">
      {films.length ? (
        <div className={`absolute inset-0 ${split ? "grid grid-rows-2 md:grid-cols-2 md:grid-rows-1 md:divide-x md:divide-white/20" : ""}`}>
          {films.map((film, i) => (
            <FilmPane
              key={film.src}
              video={film}
              reduceMotion={reduceMotion}
              fallbackImage={i === 0 ? image : film.poster}
              eager={i === 0}
            />
          ))}
        </div>
      ) : still ? (
        <div
          className="absolute inset-0 bg-cover bg-[center_22%] md:bg-center"
          style={{ backgroundImage: `url(${still})` }}
          role="img"
          aria-label={kicker}
        />
      ) : null}

      <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: "var(--hero-veil)" }} />

      <div className="pointer-events-none relative z-10 mx-auto flex h-full w-full max-w-3xl flex-col items-center justify-end px-6 pb-16 pt-[calc(var(--store-chrome)+1rem)] text-center md:pb-20">
        <div className="flex w-full flex-col items-center gap-4 md:gap-5">
          <p className="text-[11px] font-semibold uppercase leading-none tracking-[0.2em] text-white [text-shadow:0_1px_8px_rgba(0,0,0,0.55)]">{kicker}</p>
          <h1 className="max-w-[16ch] text-balance font-display text-4xl font-medium italic leading-[0.95] tracking-tight text-white [text-shadow:0_2px_18px_rgba(0,0,0,0.45)] md:text-6xl lg:text-[4.75rem]">
            {lines.map((line, i) => (
              <span key={i}>
                {i > 0 ? <br /> : null}
                {line}
              </span>
            ))}
          </h1>
          {subtitle ? (
            <p className={`max-w-md text-pretty text-[13px] leading-relaxed text-white/90 md:text-sm ${split ? "hidden sm:block" : ""}`}>
              {subtitle}
            </p>
          ) : null}
          {children ? <div className="pointer-events-auto w-full">{children}</div> : null}
          {actions.length ? (
            <div className="pointer-events-auto mx-auto flex w-full max-w-[12rem] flex-col items-stretch gap-3 sm:max-w-[24.75rem] sm:flex-row sm:justify-center">
              {actions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  prefetch
                  className={`btn-hero ${action.variant === "solid" ? "btn-hero-solid" : "btn-hero-outline"}`}
                >
                  {action.label}
                </Link>
              ))}
            </div>
          ) : null}
          {links?.length ? (
            <nav className="pointer-events-auto flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] font-semibold uppercase leading-none tracking-[0.2em] text-white [text-shadow:0_1px_8px_rgba(0,0,0,0.55)]">
              {links.map((link, i) => (
                <Fragment key={link.href}>
                  {i > 0 ? <span className="select-none text-white/30">·</span> : null}
                  <Link href={link.href} className="transition-opacity duration-100 hover:opacity-80">
                    {link.label}
                  </Link>
                </Fragment>
              ))}
            </nav>
          ) : null}
        </div>
      </div>
    </section>
  );
}
