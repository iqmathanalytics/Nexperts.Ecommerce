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
  /** Optional lighter source for save-data / very slow links. */
  srcMobile?: string;
  poster: string;
  alt: string;
};

function pickVideoSrc(video: CampaignHeroVideo) {
  if (typeof window === "undefined") return video.src;
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  const saveData = Boolean(connection?.saveData);
  // Only throttle on truly constrained links — treating "3g" as slow forced soft 360p on many desktops/phones.
  const verySlow = connection?.effectiveType === "2g" || connection?.effectiveType === "slow-2g";
  if ((saveData || verySlow) && video.srcMobile) return video.srcMobile;
  return video.src;
}

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
  const wrapRef = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLVideoElement>(null);
  const still = fallbackImage || video.poster;
  const [src, setSrc] = useState(video.src);
  const [inView, setInView] = useState(eager ?? false);
  // Poster paints first for LCP; video arms after the page is idle.
  const [ready, setReady] = useState(false);
  const [hasFrame, setHasFrame] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setSrc(pickVideoSrc(video));
    setHasFrame(false);
    setFailed(false);
  }, [video]);

  useEffect(() => {
    if (reduceMotion) return;
    if (!eager) return;
    const armVideo = () => setReady(true);
    const idle = window.requestIdleCallback?.(armVideo, { timeout: 1800 });
    const fallback = idle == null ? window.setTimeout(armVideo, 1200) : undefined;
    return () => {
      if (idle != null) window.cancelIdleCallback?.(idle);
      if (fallback) window.clearTimeout(fallback);
    };
  }, [eager, reduceMotion]);

  useEffect(() => {
    const root = wrapRef.current;
    if (!root || reduceMotion) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        const visible = Boolean(entry?.isIntersecting);
        setInView(visible);
        if (visible && !eager) setReady(true);
      },
      { root: null, threshold: 0.15, rootMargin: "120px 0px" },
    );
    io.observe(root);
    return () => io.disconnect();
  }, [reduceMotion, eager]);

  useEffect(() => {
    const el = ref.current;
    if (!el || reduceMotion || !ready || failed) return;
    el.muted = true;
    if (inView) {
      const play = () => el.play().catch(() => undefined);
      // Wait for enough data so playback doesn't stutter/break on first paint.
      if (el.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) play();
      else {
        const onCanPlay = () => {
          el.removeEventListener("canplay", onCanPlay);
          play();
        };
        el.addEventListener("canplay", onCanPlay);
        el.load();
        return () => el.removeEventListener("canplay", onCanPlay);
      }
    } else {
      el.pause();
    }
  }, [reduceMotion, ready, inView, src, failed]);

  useEffect(() => {
    const onVisible = () => {
      const el = ref.current;
      if (!el || reduceMotion || !inView || failed) return;
      if (document.visibilityState === "visible") el.play().catch(() => undefined);
      else el.pause();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [reduceMotion, inView, failed]);

  const showPoster = reduceMotion || !ready || failed || !hasFrame;

  return (
    <div ref={wrapRef} className="hero-film">
      {showPoster ? (
        <div
          className="absolute inset-0 bg-cover bg-[center_22%] md:bg-center"
          style={{ backgroundImage: `url(${still})` }}
          role="img"
          aria-label={video.alt}
        />
      ) : null}
      {!reduceMotion && ready && !failed ? (
        <video
          key={src}
          ref={ref}
          className={`hero-film-media transition-opacity duration-300 ${hasFrame ? "opacity-100" : "opacity-0"}`}
          muted
          loop
          playsInline
          preload={eager ? "metadata" : "none"}
          poster={video.poster}
          aria-label={video.alt}
          onPlaying={() => setHasFrame(true)}
          onLoadedData={() => setHasFrame(true)}
          onError={() => {
            // Fall back once to the lighter file, then stay on poster.
            if (video.srcMobile && src !== video.srcMobile) {
              setHasFrame(false);
              setSrc(video.srcMobile);
              return;
            }
            setFailed(true);
          }}
          onWaiting={() => {
            /* keep last frame; browser buffers without blanking the layer */
          }}
        >
          <source src={src} type="video/mp4" />
        </video>
      ) : null}
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
  kicker?: string;
  title: string;
  subtitle?: string;
  actions: CampaignHeroAction[];
  links?: CampaignHeroLink[];
  children?: ReactNode;
}) {
  const [reduceMotion, setReduceMotion] = useState(false);
  const [narrow, setNarrow] = useState(false);
  const allFilms = videos?.length ? videos : video ? [video] : [];
  // Mobile: one film only — dual autoplay was ~10MB and stalled the main thread.
  const films = narrow && allFilms.length > 1 ? [allFilms[0]!] : allFilms;
  const split = films.length > 1;

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const width = window.matchMedia("(max-width: 767px)");
    const syncMotion = () => setReduceMotion(motion.matches);
    const syncWidth = () => setNarrow(width.matches);
    syncMotion();
    syncWidth();
    motion.addEventListener("change", syncMotion);
    width.addEventListener("change", syncWidth);
    return () => {
      motion.removeEventListener("change", syncMotion);
      width.removeEventListener("change", syncWidth);
    };
  }, []);

  const lines = title.split("\n");
  const still = image || films[0]?.poster;

  return (
    <section className="hero-stage relative bg-brand">
      {films.length ? (
        <div className={`absolute inset-0 ${split ? "grid grid-rows-2 md:grid-cols-2 md:grid-rows-1 md:divide-x md:divide-white/20" : ""}`}>
          {films.map((film, i) => (
            <FilmPane
              key={`${film.src}-${film.alt}`}
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
          aria-label={kicker || title}
        />
      ) : null}

      <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: "var(--hero-veil)" }} />

      <div className="pointer-events-none relative z-10 mx-auto flex h-full w-full max-w-3xl flex-col items-center justify-end px-6 pb-24 pt-[calc(var(--store-chrome)+1rem)] text-center md:pb-20">
        <div className="flex w-full flex-col items-center gap-4 md:gap-5">
          {kicker ? (
            <p className="text-[11px] font-semibold uppercase leading-none tracking-[0.2em] text-white [text-shadow:0_1px_8px_rgba(0,0,0,0.55)]">{kicker}</p>
          ) : null}
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
