"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import { FilmStripCarousel } from "../components/FilmStripCarousel";
import { WeddingColours } from "../components/WeddingColours";

type AttendingStatus = "yes" | "no" | null;
type GuestCategory = "abanas-family" | "obis-family" | "csu" | "general" | "";

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

function useGalleryReveal() {
  const ref = useRef<HTMLElement | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [floating, setFloating] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setRevealed(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!revealed) return;
    const t = setTimeout(() => setFloating(true), 800);
    return () => clearTimeout(t);
  }, [revealed]);

  return { ref, revealed, floating };
}
export default function Home() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState<GuestCategory>("");
  const [attending, setAttending] = useState<AttendingStatus>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const introRef = useScrollReveal();
  const gallery = useGalleryReveal();
  const dayRef = useScrollReveal();
  const locationRef = useScrollReveal();
  const rsvpRef = useScrollReveal();
  const supportRef = useScrollReveal();
  const contactRef = useScrollReveal();

  const [hoveredCard, setHoveredCard] = useState<1 | 2 | null>(null);
  const [parallaxTilt, setParallaxTilt] = useState(0);

  useEffect(() => {
    const el = gallery.ref.current;
    if (!el) return;

    const onScroll = () => {
      const rect = el.getBoundingClientRect();
      const sectionHeight = rect.height;
      const progress = Math.max(
        0,
        Math.min(1, -rect.top / sectionHeight)
      );
      const tilt = 4 - progress * 8;
      setParallaxTilt(tilt);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [gallery.ref]);

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = useCallback(async () => {
    setError(null);
    setSuccess(null);

    if (
      !fullName.trim() ||
      !phone.trim() ||
      !email.trim() ||
      !category ||
      !attending
    ) {
      setError("Please fill in all fields, choose a category, and select if you will attend.");
      return;
    }

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          category,
          attending: attending === "yes",
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Something went wrong. Please try again.");
      }

      setSuccess(
        attending === "yes"
          ? "Thank you! Your RSVP has been received. Please check your email for your digital access card."
          : "We're sorry you won't make it — but thank you for letting us know. You'll be with us in spirit. 🤍"
      );
      setFullName("");
      setPhone("");
      setEmail("");
      setCategory("");
      setAttending(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to submit RSVP at the moment. Please try again shortly."
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [attending, category, email, fullName, phone]);

  const handleCopyAccount = useCallback(async () => {
    try {
      await navigator.clipboard.writeText("0000711380");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
    }
  }, []);

  const handleScrollToContent = useCallback(() => {
    const el = document.getElementById("welcome");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  }, []);

  return (
    <main className="min-h-screen bg-page text-foreground">
      {/* Hero */}
      <section
        className="grain-overlay vignette relative flex min-h-screen items-center justify-center px-6 py-10 md:px-10 lg:px-16"
      >
        <div className="absolute inset-0 -z-10">
          <Image
            src="/images/couple-1.jpg"
            alt="Elegant Nigerian wedding couple"
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/30 to-black/10" />
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#7a3218]/80 via-transparent to-transparent" />
        </div>

        <div className="mx-auto flex w-full max-w-4xl flex-col items-center text-center text-white">
          <p className="font-script text-4xl leading-tight sm:text-5xl md:text-6xl">
            Chinedu <span className="font-serif-display text-3xl align-middle">&amp;</span> Uju
          </p>
          <p className="mt-4 font-serif-display text-lg italic tracking-wide sm:text-xl">
            invite you to celebrate their union
          </p>
          <p className="mt-6 text-xs tracking-[0.35em] sm:text-sm">
            #THECUSTORY&apos;26
          </p>

          <div className="mt-8 inline-flex items-center gap-3 rounded-full bg-white/10 px-6 py-2 text-lg uppercase tracking-[0.2em] backdrop-blur">
            <span>Saturday</span>
            <span className="h-px w-6 bg-white/40" />
            <span>May 16, 2026</span>
          </div>

          <p className="mt-6 text-sm text-white/80 sm:text-base">
            St. Leo&apos;s Catholic Church Ikeja &middot; Lagos Country Club GRA Ikeja
          </p>

          <button
            type="button"
            onClick={handleScrollToContent}
            className="group mt-16 flex flex-col items-center gap-4 text-xs tracking-[0.25em] text-white/70"
          >
            <span className="uppercase">Scroll to explore</span>
            <span className="relative h-16 w-px overflow-hidden bg-white/20">
              <span className="absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-white to-transparent opacity-90 transition-all duration-700 group-hover:h-10 group-hover:translate-y-4" />
            </span>
          </button>
        </div>
      </section>

      {/* Couple photo gallery – scattered polaroid wall */}
      <section
        ref={gallery.ref}
        className="relative overflow-visible py-16 lg:py-24"
      >
        <p className="mx-auto max-w-5xl px-6 text-center font-serif-display text-xs uppercase tracking-[0.28em] text-neutral-500 lg:px-0">
          Our Story
        </p>
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none font-serif-display text-[18rem] leading-none text-wine"
          aria-hidden
        >
          &amp;
        </div>
        <div
          className="relative mx-auto flex min-h-[380px] max-w-5xl flex-col items-center justify-center gap-8 px-6 pt-12 lg:min-h-[420px] lg:flex-row lg:items-center lg:justify-center lg:gap-0 lg:pt-16"
          style={{
            perspective: "800px",
            transform: `perspective(800px) rotateX(${parallaxTilt}deg)`,
            willChange: "transform",
          }}
        >
          <div
            className="relative flex flex-col items-center lg:mr-[-3rem] lg:mt-0"
            style={{
              width: "min(320px, max(80vw, 260px))",
            }}
          >
            <div
              onMouseEnter={() => setHoveredCard(1)}
              onMouseLeave={() => setHoveredCard(null)}
              className={`relative w-full cursor-default bg-white pb-10 pt-4 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.18),0_12px_24px_-8px_rgba(0,0,0,0.12)] transition-all duration-300 ease-out lg:w-80 lg:px-5 ${gallery.floating && hoveredCard === null ? "gallery-float-a" : ""}`}
              style={{
                opacity: gallery.revealed ? 1 : 0,
                transform:
                  !gallery.revealed
                    ? "translateY(-60px) scale(0.85) rotate(0deg)"
                    : hoveredCard === 1
                      ? "scale(1.06) rotate(0deg)"
                      : hoveredCard === 2
                        ? "scale(0.97) rotate(-3deg)"
                        : gallery.floating
                          ? undefined
                          : "rotate(-3deg)",
                transition:
                  "opacity 600ms cubic-bezier(0.34, 1.56, 0.64, 1), transform 600ms cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 300ms ease-out, filter 300ms ease-out",
                boxShadow:
                  hoveredCard === 1
                    ? "0 32px 64px -16px rgba(0,0,0,0.22), 0 16px 32px -8px rgba(0,0,0,0.14)"
                    : "0 24px 48px -12px rgba(0,0,0,0.18), 0 12px 24px -8px rgba(0,0,0,0.12)",
                zIndex: hoveredCard === 1 ? 10 : 1,
                animation: hoveredCard !== null ? "none" : undefined,
                filter: hoveredCard === 2 ? "brightness(0.97)" : undefined,
              }}
            >
              <div className="relative aspect-square w-full overflow-hidden px-5 lg:px-0">
                <Image
                  src="/images/couple-16.jpg"
                  alt="Uju and Chinedu — just us"
                  fill
                  sizes="(max-width: 1023px) 80vw, 320px"
                  className="object-cover"
                />
              </div>
              <p className="absolute bottom-4 left-0 right-0 text-center font-serif-display text-sm italic text-neutral-600">
                Just us.
              </p>
            </div>
          </div>

          <div
            className="relative flex flex-col items-center lg:ml-[-4rem] lg:mt-16"
            style={{ width: "min(288px, max(72vw, 240px))" }}
          >
            <div
              onMouseEnter={() => setHoveredCard(2)}
              onMouseLeave={() => setHoveredCard(null)}
              className={`relative w-full cursor-default bg-white pb-10 pt-4 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.18),0_12px_24px_-8px_rgba(0,0,0,0.12)] transition-all duration-300 ease-out lg:w-72 lg:px-5 ${gallery.floating && hoveredCard === null ? "gallery-float-b" : ""}`}
              style={{
                opacity: gallery.revealed ? (hoveredCard === 1 ? 0.85 : 1) : 0,
                transform:
                  !gallery.revealed
                    ? "translateY(-60px) scale(0.85) rotate(0deg)"
                    : hoveredCard === 2
                      ? "scale(1.06) rotate(0deg)"
                      : hoveredCard === 1
                        ? "scale(0.97) rotate(2.5deg)"
                        : gallery.floating
                          ? undefined
                          : "rotate(2.5deg)",
                transition:
                  "opacity 600ms cubic-bezier(0.34, 1.56, 0.64, 1), transform 600ms cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 300ms ease-out, filter 300ms ease-out",
                transitionDelay: "150ms",
                boxShadow:
                  hoveredCard === 2
                    ? "0 32px 64px -16px rgba(0,0,0,0.22), 0 16px 32px -8px rgba(0,0,0,0.14)"
                    : "0 24px 48px -12px rgba(0,0,0,0.18), 0 12px 24px -8px rgba(0,0,0,0.12)",
                zIndex: hoveredCard === 2 ? 10 : 0,
                animation: hoveredCard !== null ? "none" : undefined,
                filter: hoveredCard === 1 ? "brightness(0.97)" : undefined,
              }}
            >
              <div className="relative aspect-square w-full overflow-hidden px-5 lg:px-0">
                <Image
                  src="/images/couple-14.jpg"
                  alt="Uju and Chinedu — our story begins"
                  fill
                  sizes="(max-width: 1023px) 72vw, 288px"
                  className="object-cover"
                />
              </div>
              <p className="absolute bottom-4 left-0 right-0 text-center font-serif-display text-sm italic text-neutral-600">
                Our story begins.
              </p>
            </div>
          </div>
        </div>

        <FilmStripCarousel
          images={[
            { src: "/images/couple-27.jpg", alt: "Uju and Chinedu" },
            { src: "/images/couple-44.jpg", alt: "Uju and Chinedu" },
            { src: "/images/couple-8.jpg", alt: "Uju and Chinedu" },
            { src: "/images/couple-35.jpg", alt: "Uju and Chinedu" },
            { src: "/images/couple-19.jpg", alt: "Uju and Chinedu" },
            { src: "/images/couple-41.jpg", alt: "Uju and Chinedu" },
            { src: "/images/couple-3.jpg", alt: "Uju and Chinedu" },
            { src: "/images/couple-32.jpg", alt: "Uju and Chinedu" },
            { src: "/images/couple-39.jpg", alt: "Uju and Chinedu" },
            { src: "/images/couple-23.jpg", alt: "Uju and Chinedu" },
            { src: "/images/couple-6.jpg", alt: "Uju and Chinedu" },
            { src: "/images/couple-45.jpg", alt: "Uju and Chinedu" },
            { src: "/images/couple-31.jpg", alt: "Uju and Chinedu" },
            { src: "/images/couple-30.jpg", alt: "Uju and Chinedu" },
            { src: "/images/couple-11.jpg", alt: "Uju and Chinedu" },
            { src: "/images/couple-37.jpg", alt: "Uju and Chinedu" },
            { src: "/images/couple-20.jpg", alt: "Uju and Chinedu" },
            { src: "/images/couple-4.jpg", alt: "Uju and Chinedu" },
            { src: "/images/couple-33.jpg", alt: "Uju and Chinedu" },
            { src: "/images/couple-24.jpg", alt: "Uju and Chinedu" },
            { src: "/images/couple-43.jpg", alt: "Uju and Chinedu" },
            { src: "/images/couple-9.jpg", alt: "Uju and Chinedu" },
            { src: "/images/couple-38.jpg", alt: "Uju and Chinedu" },
            { src: "/images/couple-13.jpg", alt: "Uju and Chinedu" },
            { src: "/images/couple-42.jpg", alt: "Uju and Chinedu" },
            { src: "/images/couple-21.jpg", alt: "Uju and Chinedu" },
            { src: "/images/couple-36.jpg", alt: "Uju and Chinedu" },
            { src: "/images/couple-7.jpg", alt: "Uju and Chinedu" },
            { src: "/images/couple-34.jpg", alt: "Uju and Chinedu" },
            { src: "/images/couple-15.jpg", alt: "Uju and Chinedu" },
            { src: "/images/couple-29.jpg", alt: "Uju and Chinedu" },
            { src: "/images/couple-10.jpg", alt: "Uju and Chinedu" },
            { src: "/images/couple-26.jpg", alt: "Uju and Chinedu" },
            { src: "/images/couple-40.jpg", alt: "Uju and Chinedu" },
            { src: "/images/couple-5.jpg", alt: "Uju and Chinedu" },
            { src: "/images/couple-17.jpg", alt: "Uju and Chinedu" },
            { src: "/images/couple-12.jpg", alt: "Uju and Chinedu" },
            { src: "/images/couple-25.jpg", alt: "Uju and Chinedu" },
            { src: "/images/couple-18.jpg", alt: "Uju and Chinedu" },
            { src: "/images/couple-28.jpg", alt: "Uju and Chinedu" },
            { src: "/images/couple-22.jpg", alt: "Uju and Chinedu" },
          ]}
        />
      </section>

      <div className="section-divider px-6 lg:px-0">
        <span className="section-divider-icon" />
      </div>

      {/* The Day – Unified Schedule Timeline */}
      <section
        ref={dayRef}
        className="mx-auto max-w-5xl px-6 py-16 md:px-10 lg:px-0 lg:py-20"
      >
        <div className="mb-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between md:gap-4">
          <div>
            <p className="font-serif-display text-sm uppercase tracking-[0.25em] text-neutral-500">
              The Day
            </p>
            <h2 className="mt-2 font-serif-display text-3xl text-foreground md:text-4xl">
              Saturday, May 16, 2026
            </h2>
          </div>
        </div>

        <div className="relative">
          <div className="pointer-events-none absolute left-1/2 top-8 hidden h-[260px] -translate-x-1/2 border-l border-dashed border-royal/60 md:block lg:hidden" />
          <div className="hidden h-0.5 w-full bg-gradient-to-r from-wine/15 via-royal/70 to-wine/15 lg:block" />
          <div className="mt-10 grid gap-12 md:grid-cols-2 md:gap-8">
            <article className="relative space-y-3 border border-neutral-200/80 bg-white/70 p-6 shadow-[0_18px_40px_rgba(0,0,0,0.03)] backdrop-blur-sm">
              <p className="font-serif-display text-2xl text-wine">10:00 AM</p>
              <h3 className="font-serif-display text-lg tracking-wide text-foreground">
                Wedding Mass
              </h3>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-royal">
                St. Leo&apos;s Catholic Church
              </p>
              <p className="text-xs text-neutral-600">
                St. Leo&apos;s Catholic Church Toyin Street
              </p>
            </article>

            <article className="relative space-y-3 border border-neutral-200/80 bg-white/70 p-6 shadow-[0_18px_40px_rgba(0,0,0,0.03)] backdrop-blur-sm">
              <p className="font-serif-display text-2xl text-wine">2:00 PM</p>
              <h3 className="font-serif-display text-lg tracking-wide text-foreground">
                Wedding Reception
              </h3>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-royal">
                Lagos Country Club GRA
              </p>
              <p className="text-xs text-neutral-600">
                G.R.A, 2, Jeol Ogunnaike Street, Off Mobolaji Bank Anthony Way, Lagos State
              </p>
              <p className="mt-2 text-[11px] text-neutral-500">
                Follows immediately after the mass ceremony.
              </p>
            </article>
          </div>

          <p className="mt-8 text-xs text-neutral-600 md:hidden">
            All events will be held in Ikeja, Lagos State, Nigeria.
          </p>
        </div>
      </section>

      <div className="section-divider px-6 lg:px-0">
        <span className="section-divider-icon" />
      </div>

      {/* Location / Map */}
      <section
        ref={locationRef}
        className="mx-auto max-w-5xl px-6 py-16 md:px-10 lg:px-0 lg:py-20"
      >
        <div className="mb-8">
          <p className="font-serif-display text-sm uppercase tracking-[0.24em] text-neutral-500">
            Location
          </p>

        </div>

        <div className="space-y-6">
          <div className="overflow-hidden rounded-2xl border border-wine/60 bg-white shadow-[0_24px_60px_rgba(0,0,0,0.08)]">
            <div className="aspect-[4/3] w-full">

              <iframe
                className="h-full w-full border-0"
                src="https://www.google.com/maps/d/embed?mid=1am7T6h8_nHCV2Awm7B2mDdeb_AejTD4&ehbc=2E312F">
              </iframe>
            </div>
          </div>

        </div>
      </section>

      <div className="section-divider px-6 lg:px-0">
        <span className="section-divider-icon" />
      </div>

      {/* RSVP */}
      <section
        ref={rsvpRef}
        className="mx-auto max-w-5xl px-6 py-16 md:px-10 lg:px-0 lg:py-20"
      >
        <div className="grid overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-[0_24px_70px_rgba(0,0,0,0.06)] md:grid-cols-[minmax(0,3fr)_minmax(0,4fr)]">
          <div className="grain-overlay relative flex flex-col justify-between bg-wine px-8 py-10 text-white md:px-10 lg:px-12">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-white/70">
                RSVP
              </p>
              <p className="mt-4 font-script text-4xl leading-tight sm:text-5xl">
                Uju &amp; Chinedu
              </p>
              <p className="mt-6 max-w-xs text-sm text-white/80">
                Your presence means the world to us. Kindly RSVP on or before{" "}
                <span className="font-semibold">Sunday, May 10, 2026</span>.
              </p>
            </div>
            <p className="mt-10 text-[11px] uppercase tracking-[0.25em] text-white/60">
              #TheCUStory&apos;26
            </p>
          </div>

          <div className="space-y-4 bg-white px-8 py-10 text-sm text-neutral-800 md:px-10 lg:px-12">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-medium tracking-wide text-neutral-600">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm outline-none ring-0 transition focus:border-wine focus:bg-white focus:ring-2 focus:ring-wine/20"
                  placeholder="e.g. John Doe"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium tracking-wide text-neutral-600">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm outline-none ring-0 transition focus:border-wine focus:bg-white focus:ring-2 focus:ring-wine/20"
                  placeholder="e.g. 0801 234 5678"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium tracking-wide text-neutral-600">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm outline-none ring-0 transition focus:border-wine focus:bg-white focus:ring-2 focus:ring-wine/20"
                  placeholder="yourname@example.com"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-medium tracking-wide text-neutral-600">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as GuestCategory)}
                  className="w-full rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm outline-none ring-0 transition focus:border-wine focus:bg-white focus:ring-2 focus:ring-wine/20"
                >
                  <option value="">Select your category</option>
                  <option value="abanas-family">Abana&apos;s Family</option>
                  <option value="obis-family">Obi&apos;s Family</option>
                  <option value="csu">CSU</option>
                  <option value="general">General</option>
                </select>
              </div>
            </div>

            <div className="mt-2 space-y-2">
              <p className="text-xs font-medium tracking-wide text-neutral-600">
                Will you attend?
              </p>
              <div className="inline-flex rounded-full border border-neutral-200 bg-neutral-50 p-1 text-xs">
                <button
                  type="button"
                  onClick={() => setAttending("yes")}
                  className={`min-w-[80px] rounded-full px-4 py-1.5 text-center transition ${attending === "yes"
                    ? "bg-wine text-white shadow-sm"
                    : "text-neutral-700 hover:bg-white"
                    }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setAttending("no")}
                  className={`min-w-[80px] rounded-full px-4 py-1.5 text-center transition ${attending === "no"
                    ? "bg-wine text-white shadow-sm"
                    : "text-neutral-700 hover:bg-white"
                    }`}
                >
                  No
                </button>
              </div>
            </div>

            {error && (
              <p className="mt-2 text-xs text-red-600">
                {error}
              </p>
            )}
            {success && (
              <p className="mt-2 text-xs text-emerald-700">
                {success}
              </p>
            )}

            <div className="pt-4">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-wine px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.22em] text-white shadow-[0_14px_30px_rgba(181,82,43,0.35)] transition hover:bg-royal hover:text-[#3d2502] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine/40 disabled:cursor-not-allowed disabled:bg-wine/60"
              >
                {isSubmitting && (
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                )}
                <span>Send My RSVP</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="section-divider px-6 lg:px-0">
        <span className="section-divider-icon" />
      </div>

      {/* Contact */}
      <section
        ref={contactRef}
        className="mx-auto max-w-5xl px-6 py-16 md:px-10 lg:px-0 lg:py-20"
      >
        <div className="mb-8 text-center">
          <p className="font-serif-display text-sm uppercase tracking-[0.24em] text-neutral-500">
            Contact
          </p>
          <h2 className="mt-2 font-serif-display text-2xl text-foreground md:text-3xl">
            For any Questions
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-neutral-700">
            Reach out to the coordinator below for directions, logistics, or further details.
          </p>
        </div>

        <div className="">
          <div
            className="rounded-2xl border border-neutral-200 bg-white px-6 py-5 text-center shadow-[0_18px_40px_rgba(0,0,0,0.03)] transition hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(0,0,0,0.06)]"
          >
            <p className="mt-2 text-sm text-neutral-800">
              <a href={`tel:0802 842 3189`} className="hover:text-royal">
                0802 842 3189
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="grain-overlay bg-wine px-6 py-14 text-center text-white md:px-10 lg:px-0">
        <p className="font-script text-2xl leading-relaxed sm:text-3xl">
          We can&apos;t wait to share this beautiful day with you.
        </p>
        <p className="mt-3 font-serif-display text-sm text-white/80">
          With Love, Uju &amp; Chinedu
        </p>
        <p className="mt-4 text-xs tracking-[0.32em] text-white/60">
          #TheCUStory&apos;26
        </p>
      </footer>
    </main>
  );
}
