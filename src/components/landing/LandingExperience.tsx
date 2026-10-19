"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { mythCards } from "@/content/myths";
import GuessDial from "@/components/landing/GuessDial";
import MetabolismStory from "@/components/landing/MetabolismStory";
import MythWall from "@/components/landing/MythWall";
import BrandMark from "@/components/BrandMark";
import { captureUtm, trackEvent } from "@/lib/analytics";
import { getSessionId } from "@/lib/game";

type DoubtId = "safe" | "muscle-loss" | "regain" | "diabetes-only" | "for-me";
type ModeId = "quick-quiz" | "myth-fact";

const doubts: { id: DoubtId; label: string }[] = [
  { id: "safe", label: "safe" },
  { id: "muscle-loss", label: "muscle loss" },
  { id: "regain", label: "weight comes back" },
  { id: "diabetes-only", label: "only for diabetics" },
  { id: "for-me", label: "is it for me" },
];

const modes: { id: ModeId; title: string; note: string; mark: string }[] = [
  { id: "quick-quiz", title: "Quick quiz", note: "7 questions · about 2 minutes", mark: "01" },
  { id: "myth-fact", title: "Myth vs fact", note: "7 swipes · learn as you go", mark: "02" },
];

export default function LandingExperience() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const heroRef = useRef<HTMLElement>(null);
  const revealRef = useRef<HTMLElement>(null);
  const sentDepthRef = useRef(new Set<number>());
  const [guess, setGuess] = useState(50);
  const [locked, setLocked] = useState(false);
  const [selectedDoubt, setSelectedDoubt] = useState<DoubtId | null>(null);
  const [selectedMode, setSelectedMode] = useState<ModeId | null>(null);
  const [notice, setNotice] = useState("");
  const [bottomCtaVisible, setBottomCtaVisible] = useState(false);
  const [pageUrl, setPageUrl] = useState("");
  const [streak, setStreak] = useState(0);
  const [returning, setReturning] = useState(false);

  useEffect(() => {
    captureUtm();
    trackEvent("hero_view");
    setPageUrl(window.location.href);
    try {
      const savedDoubt = window.localStorage.getItem("steerclub:doubt");
      if (savedDoubt && doubts.some((item) => item.id === savedDoubt)) {
        setSelectedDoubt(savedDoubt as DoubtId);
      }
      const rawSavedGuess = window.localStorage.getItem("steerclub:guess");
      if (rawSavedGuess !== null) {
        const savedGuess = Number(rawSavedGuess);
        if (Number.isFinite(savedGuess) && savedGuess >= 0 && savedGuess <= 100) setGuess(savedGuess);
      }

      const sessionId = getSessionId();
      void fetch(`/api/session?id=${encodeURIComponent(sessionId)}`, { cache: "no-store" })
        .then((response) => response.ok ? response.json() : null)
        .then((payload) => {
          if (!payload) return;
          if (typeof payload.streak === "number") setStreak(payload.streak);
          if (payload.returning === true) {
            setReturning(true);
            if (window.localStorage.getItem("steerclub:doubt")) setLocked(true);
          }
        })
        .catch(() => undefined);
    } catch {
      // Private browsing can block local storage; the page remains fully usable without it.
    }
  }, []);

  useEffect(() => {
    if (!returning || !locked) return;
    const frame = window.requestAnimationFrame(() => revealRef.current?.scrollIntoView({ behavior: "auto", block: "start" }));
    return () => window.cancelAnimationFrame(frame);
  }, [returning, locked]);

  useEffect(() => {
    function recordDepth() {
      const page = document.documentElement;
      const maximum = page.scrollHeight - window.innerHeight;
      if (maximum <= 0) return;
      const depth = Math.min(100, Math.floor((window.scrollY / maximum) * 100 / 25) * 25);
      for (const milestone of [25, 50, 75, 100]) {
        if (depth >= milestone && !sentDepthRef.current.has(milestone)) {
          sentDepthRef.current.add(milestone);
          trackEvent("scroll_depth", { depth: milestone });
        }
      }
    }
    window.addEventListener("scroll", recordDepth, { passive: true });
    return () => window.removeEventListener("scroll", recordDepth);
  }, []);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => {
      setBottomCtaVisible(!entry.isIntersecting);
    }, { threshold: 0.08 });
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  const sourceList = useMemo(() => {
    const unique = new Map<string, { title: string; url: string }>();
    mythCards.forEach((card) => card.sources.forEach((source) => unique.set(source.url, source)));
    return Array.from(unique.values()).slice(0, 7);
  }, []);

  function lockGuess() {
    if (locked) return;
    setLocked(true);
    trackEvent("dial_locked", { guess });
    try {
      window.localStorage.setItem("steerclub:guess", String(guess));
    } catch {
      // The guess is still available for this visit if storage is disabled.
    }
    window.setTimeout(() => {
      revealRef.current?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    }, reduceMotion ? 0 : 220);
  }

  function chooseDoubt(id: DoubtId) {
    setSelectedDoubt(id);
    setSelectedMode(null);
    setNotice("Saved on this device. Two questions in your round will speak to this doubt.");
    trackEvent("doubt_tapped", { doubt: id });
    try {
      window.localStorage.setItem("steerclub:doubt", id);
    } catch {
      // An unavailable storage API does not block the interaction.
    }
  }

  function chooseMode(id: ModeId) {
    setSelectedMode(id);
    trackEvent("mode_selected", { mode: id });
    if (!selectedDoubt) {
      setNotice("Choose one doubt first so the round can keep it in mind.");
      return;
    }
    setNotice("Your doubt is saved. Opening your seven-question round.");
    router.push(`/play?mode=${id}`);
  }

  const currentDoubt = doubts.find((item) => item.id === selectedDoubt);

  return (
    <div className="page-root">
      <div className="page-grain" aria-hidden="true" />
      <div className="experience-layout">
        <div className="experience-column">
          <header className="site-header">
            <a className="wordmark" href="#top" aria-label="Steer Club, back to the beginning">
              <BrandMark className="landing-brand-mark" />
            </a>
            <span className="streak-pill" aria-label={`Your current streak is ${streak} days`}>
              <span className="streak-mark" aria-hidden="true" /> {streak}-day streak
            </span>
          </header>

          <main id="top">
            <section ref={heroRef} className="hero" id="hero" aria-labelledby="hero-title">
              <p className="hero-kicker"><span className="kicker-rule" /> {returning ? `welcome back${streak ? `, day ${streak}` : ""} · your thread is still here` : "a small question, before the day gets loud"}</p>
              <h1 id="hero-title">How much of your metabolic health is <em>actually in your control?</em></h1>
              <GuessDial value={guess} onChange={setGuess} locked={locked} />
              <button className="primary-button" type="button" onClick={lockGuess} disabled={locked} aria-pressed={locked}>
                {locked ? "Guess locked" : "Lock in my guess"}
                {!locked && <span className="button-arrow" aria-hidden="true">→</span>}
              </button>
              <p className="hero-footnote" id="dial-help">A starting thought, not a health score.</p>
            </section>

            <AnimatePresence initial={false}>
              {locked && (
                <motion.section
                  ref={revealRef}
                  className="reveal-section section-pad"
                  id="reveal"
                  aria-labelledby="reveal-title"
                  initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
                  transition={{ duration: reduceMotion ? 0 : 0.45, ease: [0.2, 0.75, 0.25, 1] }}
                >
                  <div className="reveal-note">
                    <p className="section-kicker"><span className="kicker-rule" /> the note beside your guess</p>
                    <h2 id="reveal-title">Nobody can give you a clean number. But it’s <em>more than it feels.</em></h2>
                    <p>Genes, sleep, hormones, stress, food and the world around you all have a say. This isn’t a score, and it isn’t all on you.</p>
                    <span className="reveal-stamp"><span aria-hidden="true">✳</span> your guess: {guess}% · no judgement attached</span>
                  </div>

                  <div className="doubt-block" id="doubt">
                    <p className="section-kicker"><span className="kicker-rule" /> one tap before we begin</p>
                    <h3>what’s your biggest doubt right now?</h3>
                    <div className="doubt-options" role="group" aria-label="Choose your biggest doubt">
                      {doubts.map((item) => (
                        <button
                          className="doubt-chip"
                          type="button"
                          key={item.id}
                          aria-pressed={selectedDoubt === item.id}
                          onClick={() => chooseDoubt(item.id)}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                    <p className="doubt-feedback" aria-live="polite">
                      {currentDoubt ? `We’ll keep “${currentDoubt.label}” in mind. It will shape two questions and your final note.` : "Choose one. No name or phone number needed."}
                    </p>
                  </div>

                  <div className="mode-intro">
                    <h3>Pick up the thread</h3>
                    <span>{selectedDoubt ? "your doubt is in the margin" : "choose one doubt first"}</span>
                  </div>
                  <div className="mode-list">
                    {modes.map((mode) => (
                      <button
                        className="mode-card"
                        type="button"
                        key={mode.id}
                        disabled={!selectedDoubt}
                        aria-pressed={selectedMode === mode.id}
                        onClick={() => chooseMode(mode.id)}
                      >
                        <span>
                          <small>{mode.note}</small>
                          <strong>{mode.title}</strong>
                        </span>
                        <span className="mode-mark" aria-hidden="true">{mode.mark}</span>
                      </button>
                    ))}
                  </div>
                  {selectedMode && <p className="round-note" aria-live="polite">Your round is opening. Your doubt is saved in this browser.</p>}
                  <a className="daily-chip" href="/play?mode=daily"><strong>Today’s note</strong> · 5 questions · no sign-up <span aria-hidden="true">→</span></a>
                  <span className="status-live" role="status" aria-live="polite">{notice}</span>
                </motion.section>
              )}
            </AnimatePresence>

            <MetabolismStory />
            <MythWall locked={locked} />

            <section className="why-section section-pad" aria-labelledby="why-title">
              <p className="section-kicker"><span className="kicker-rule" /> a note worth keeping</p>
              <motion.h2
                className="section-heading"
                id="why-title"
                initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.45 }}
                transition={{ duration: reduceMotion ? 0 : 0.55 }}
              >
                This is not a <em>willpower problem.</em>
              </motion.h2>
              <motion.p
                className="why-copy"
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: reduceMotion ? 0 : 0.55, delay: reduceMotion ? 0 : 0.12 }}
              >
                Appetite signals, sleep, biology, stress and the routines around us all shape how health feels. Small choices can matter, but they are never the whole story.
              </motion.p>
              <span className="why-annotation">more compassion, less blame.</span>
            </section>

            <section className="trust-section section-pad" id="care-note" aria-labelledby="trust-title">
              <div className="trust-note">
                <p className="section-kicker"><span className="kicker-rule" /> the small print matters</p>
                <h2 id="trust-title">A note for learning, not diagnosing.</h2>
                <p>This experience is educational and is not medical advice. If a question feels personal, talk with a doctor who knows your health history. We have not claimed clinician review.</p>
              </div>
              <ul className="source-list" aria-label="Sources behind the myth-wall notes">
                {sourceList.map((source) => (
                  <li key={source.url}><span>{source.title}</span><a href={source.url} target="_blank" rel="noreferrer">Open source ↗</a></li>
                ))}
              </ul>
              <p className="privacy-note">Your guess, selected doubt, results, streak and challenge check-ins are tied to a random anonymous browser ID. Clearing browser storage removes only the local copy; use the <a href="/privacy">privacy page</a> to delete its Steer Club server record. If a care request was sent to an external destination, deletion there is separate.</p>
              <a className="care-soft-banner" href="/care">Questions that feel personal? Explore your care options <span aria-hidden="true">→</span></a>
            </section>
          </main>

          <footer className="site-footer">
            <div className="footer-top">
              <a className="wordmark" href="#top" aria-label="Steer Club, back to the beginning">
                <BrandMark className="landing-brand-mark" />
              </a>
              <a className="footer-care" href="/care">Explore your care options <span aria-hidden="true">→</span></a>
            </div>
            <div className="footer-bottom">
              <p>Educational, not medical advice. Talk to a doctor about what is right for you. No drug names, promises or weight targets.</p>
              <p><a href="#care-note">Sources &amp; review</a> · <a href="#top">Back to the note ↑</a></p>
            </div>
          </footer>
        </div>

        <aside className="desktop-note" aria-label="Open this experience on your phone">
          <p className="hand-note">best with your thumb.</p>
          <p>Scan to open this same page on a phone. The dial works with touch, a mouse or your keyboard.</p>
          <div className="qr-frame">
            {pageUrl ? <QRCodeSVG value={pageUrl} level="M" includeMargin={false} title="QR code to open this Steer Club page on a phone" /> : <span className="qr-caption">Preparing a link to this page…</span>}
            <p className="qr-caption">Your page, your device. No account.</p>
          </div>
        </aside>
      </div>

      <a className={`bottom-cta${bottomCtaVisible ? " is-visible" : ""}`} href={locked ? "#doubt" : "#hero"} tabIndex={bottomCtaVisible ? 0 : -1} aria-hidden={!bottomCtaVisible}>
        {locked ? "Choose the question on your mind" : "Make your first guess"}<span aria-hidden="true">→</span>
      </a>
    </div>
  );
}
