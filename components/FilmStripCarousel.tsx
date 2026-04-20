"use client";

import Image from "next/image";
import {
  type MouseEvent as ReactMouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export interface FilmStripCarouselProps {
  images: { src: string; alt: string }[];
}

function useScrollReveal() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("reveal-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );

    node.classList.add("reveal");
    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  return ref;
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function normalizeLoopPosition(scrollLeft: number, halfWidth: number) {
  if (halfWidth <= 0) return 0;
  let x = scrollLeft;
  while (x < 0) x += halfWidth;
  while (x >= halfWidth) x -= halfWidth;
  return x;
}

export function FilmStripCarousel({ images }: FilmStripCarouselProps) {
  const revealRef = useScrollReveal();
  const trackRef = useRef<HTMLDivElement | null>(null);

  const [isPaused, setIsPaused] = useState(false);
  const isPausedRef = useRef(isPaused);
  const isDraggingRef = useRef(false);
  const resumeTimeoutRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  const dragStartXRef = useRef(0);
  const dragStartScrollLeftRef = useRef(0);

  const doubledImages = useMemo(
    () => [...images, ...images],
    [images]
  );

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  const cancelResumeTimer = useCallback(() => {
    if (resumeTimeoutRef.current) {
      window.clearTimeout(resumeTimeoutRef.current);
      resumeTimeoutRef.current = null;
    }
  }, []);

  const scheduleResume = useCallback(() => {
    cancelResumeTimer();
    resumeTimeoutRef.current = window.setTimeout(() => {
      setIsPaused(false);
    }, 1500);
  }, [cancelResumeTimer]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    const isCoarsePointer =
      typeof window !== "undefined" &&
      window.matchMedia?.("(pointer: coarse)")?.matches;
    const speed = isCoarsePointer ? 0.8 : 0.6;

    const tick = () => {
      const node = trackRef.current;
      if (node && !isPausedRef.current && !isDraggingRef.current) {
        node.scrollLeft += speed;
        const halfWidth = node.scrollWidth / 2;
        if (halfWidth > 0 && node.scrollLeft >= halfWidth) {
          node.scrollLeft -= halfWidth;
        }
      }
      rafRef.current = window.requestAnimationFrame(tick);
    };

    rafRef.current = window.requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    return () => {
      cancelResumeTimer();
    };
  }, [cancelResumeTimer]);

  const onMouseDown = useCallback(
    (e: ReactMouseEvent<HTMLDivElement>) => {
      const node = trackRef.current;
      if (!node) return;

      cancelResumeTimer();
      isDraggingRef.current = true;
      setIsPaused(true);

      dragStartXRef.current = e.pageX;
      dragStartScrollLeftRef.current = node.scrollLeft;

      const onMove = (ev: MouseEvent) => {
        const el = trackRef.current;
        if (!el || !isDraggingRef.current) return;
        ev.preventDefault();

        const dx = ev.pageX - dragStartXRef.current;
        const halfWidth = el.scrollWidth / 2;
        el.scrollLeft = normalizeLoopPosition(
          dragStartScrollLeftRef.current - dx,
          halfWidth
        );
      };

      const onUp = () => {
        isDraggingRef.current = false;
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        scheduleResume();
      };

      window.addEventListener("mousemove", onMove, { passive: false });
      window.addEventListener("mouseup", onUp);
    },
    [cancelResumeTimer, scheduleResume]
  );

  const onMouseEnter = useCallback(() => {
    cancelResumeTimer();
    if (!isDraggingRef.current) setIsPaused(true);
  }, [cancelResumeTimer]);

  const onMouseLeave = useCallback(() => {
    cancelResumeTimer();
    if (!isDraggingRef.current) setIsPaused(false);
  }, [cancelResumeTimer]);

  const onTouchStart = useCallback(() => {
    cancelResumeTimer();
    setIsPaused(true);
  }, [cancelResumeTimer]);

  const onTouchEnd = useCallback(() => {
    scheduleResume();
  }, [scheduleResume]);

  if (images.length === 0) return null;

  return (
    <div
      ref={revealRef}
      className="mt-16 lg:mt-20 relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen overflow-hidden bg-wine py-6"
    >
      <p className="mb-6 text-center font-serif-display text-xs uppercase tracking-[0.28em] text-neutral-400">
        More Moments
      </p>

      <div
        ref={trackRef}
        className="scrollbar-hide w-full cursor-grab select-none overflow-x-auto overscroll-x-contain active:cursor-grabbing"
        onMouseDown={onMouseDown}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div className="flex w-max px-6 md:px-10">
          {doubledImages.map((img, i) => {
            const frameNumber = pad2((i % images.length) + 1);
            return (
              <div
                key={`${img.src}-${i}`}
                className="flex-none border-r border-white/10 bg-wine px-3 py-4"
              >
                <div className="grid grid-cols-10 justify-items-center gap-2">
                  {Array.from({ length: 10 }).map((_, h) => (
                    <div
                      key={h}
                      className="h-4 w-3 rounded-sm bg-white/20"
                      aria-hidden
                    />
                  ))}
                </div>

                <div className="mt-3 w-52 lg:w-60">
                  <div className="relative aspect-[3/4] w-full">
                    <Image
                      src={img.src}
                      alt={img.alt}
                      fill
                      sizes="(max-width: 1023px) 208px, 240px"
                      className="object-cover"
                      draggable={false}
                    />
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-10 justify-items-center gap-2">
                  {Array.from({ length: 10 }).map((_, h) => (
                    <div
                      key={h}
                      className="h-4 w-3 rounded-sm bg-white/20"
                      aria-hidden
                    />
                  ))}
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-white/40">
                    {frameNumber}
                  </span>
                  <span className="font-serif-display text-[10px] italic text-white/30">
                    #TheCUStory&apos;26
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

