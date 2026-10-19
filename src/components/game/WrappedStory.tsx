"use client";

import { toPng } from "html-to-image";
import { useMemo, useRef, useState } from "react";
import {
  archetypeFor,
  doubtAnswers,
  GameQuestion,
  GameResult,
  topicTakeaways,
  TopicId,
} from "@/lib/game";
import { trackEvent } from "@/lib/analytics";
import BrandMark from "@/components/BrandMark";

const topicLabels: Record<TopicId, string> = {
  food: "food",
  movement: "movement",
  sleep: "sleep",
  body: "body",
};

export default function WrappedStory({
  result,
  questions,
  onBackAction,
  shareable,
}: {
  result: GameResult;
  questions: GameQuestion[];
  onBackAction: () => void;
  shareable: boolean;
}) {
  const [slide, setSlide] = useState(0);
  const [message, setMessage] = useState("");
  const cardRef = useRef<HTMLDivElement>(null);
  const questionById = useMemo(() => new Map(questions.map((question) => [question.id, question])), [questions]);
  const hardest = result.hardestBelievedMyth;
  const topicRows = Object.entries(result.topicScores) as [TopicId, { correct: number; total: number }][];
  const modeName = result.mode === "myth-fact" ? "myth vs fact" : result.mode === "daily" ? "today’s puzzle" : "quick quiz";
  const doubtAnswer = doubtAnswers[result.selectedDoubt];
  const shareUrl = typeof window === "undefined" ? "" : `${window.location.origin}/r/${encodeURIComponent(result.id)}`;

  function goTo(next: number) {
    const bounded = Math.max(0, Math.min(6, next));
    setSlide(bounded);
    if ("vibrate" in navigator) navigator.vibrate(8);
  }

  async function copyLink() {
    if (!shareable) {
      setMessage("This round is saved on this device only; a public link is not available yet.");
      return;
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      trackEvent("share_clicked", { channel: "copy-link" });
      setMessage("Your note link is copied.");
    } catch {
      setMessage(shareUrl ? `Copy this link: ${shareUrl}` : "The share link is not ready yet.");
    }
  }

  async function downloadStory() {
    if (!cardRef.current) return;
    setMessage("Preparing a 1080 × 1920 story card…");
    try {
      const dataUrl = await toPng(cardRef.current, {
        width: 360,
        height: 640,
        pixelRatio: 3,
        cacheBust: true,
        backgroundColor: slide === 0 || slide === 2 || slide === 4 || slide === 6 ? "#661414" : "#F5EBDF",
      });
      const anchor = document.createElement("a");
      anchor.download = `steer-club-note-${result.score}-of-${result.total}.png`;
      anchor.href = dataUrl;
      anchor.click();
      trackEvent("share_clicked", { channel: "instagram-story" });
      setMessage("Story card saved to your device.");
    } catch {
      setMessage("The story image could not be saved in this browser. You can still share the link.");
    }
  }

  async function shareWhatsApp() {
    if (!shareable) {
      setMessage("A public share link is not available yet.");
      return;
    }
    const text = `I played the Steer Club ${modeName}: ${result.score}/${result.total}. Your turn — ${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
    trackEvent("share_clicked", { channel: "whatsapp" });
    setMessage("WhatsApp opened with your result link.");
  }

  const current = slide;
  const dark = [0, 2, 4, 6].includes(current);
  const scoreLabel = result.mode === "myth-fact"
    ? `You cracked ${result.score} of ${result.total} myths`
    : `You cracked ${result.score} of ${result.total} notes`;

  return (
    <section className="wrapped-shell" aria-label="Your Steer Club Wrapped">
      <div className={`wrapped-card ${dark ? "wrapped-card-dark" : "wrapped-card-light"}`} ref={cardRef}>
        <div className="wrapped-topline">
          <span className="wrapped-wordmark"><BrandMark className="wrapped-brand" /></span>
          <span>{String(slide + 1).padStart(2, "0")} / 07</span>
        </div>
        <div className="wrapped-thread" aria-hidden="true">
          {Array.from({ length: 7 }, (_, index) => <span key={index} className={index <= slide ? "is-active" : ""} />)}
        </div>

        {slide === 0 && (
          <div className="wrapped-content wrapped-cover">
            <p className="wrapped-kicker">your note from today</p>
            <h2>{scoreLabel}<em>.</em></h2>
            <p className="wrapped-subtitle">{result.total === 5 ? "Five little questions." : "Seven little questions."} No health score, no judgement.</p>
            <span className="wrapped-emblem" aria-hidden="true"><span>✳</span><i /></span>
            <p className="wrapped-mode">{modeName} · Steer Club</p>
          </div>
        )}

        {slide === 1 && (
          <div className="wrapped-content">
            <p className="wrapped-kicker">the shape of your round</p>
            <p className="wrapped-score">{result.score}<small> / {result.total}</small></p>
            <h2>{result.total === 7 ? archetypeFor(result.score) : "Curious for today"}</h2>
            <p className="wrapped-subtitle">A small learning moment, not a measure of your health.</p>
            <span className="wrapped-handline">keep the questions coming.</span>
          </div>
        )}

        {slide === 2 && (
          <div className="wrapped-content">
            <p className="wrapped-kicker">where the thread went</p>
            <h2>What felt <em>familiar?</em></h2>
            <div className="wrapped-bars">
              {topicRows.map(([topic, score]) => (
                <div className="wrapped-bar-row" key={topic}>
                  <span>{topicLabels[topic]}</span>
                  <span className="wrapped-bar"><i style={{ width: `${Math.round((score.correct / score.total) * 100)}%` }} /></span>
                  <small>{score.correct}/{score.total}</small>
                </div>
              ))}
            </div>
            <p className="wrapped-subtitle">These are answers in this round, not a health profile.</p>
          </div>
        )}

        {slide === 3 && (
          <div className="wrapped-content">
            <p className="wrapped-kicker">a thought worth turning over</p>
            <h2>{hardest ? `“${hardest.claim}”` : "Not every myth caught you."}</h2>
            {hardest ? <p className="wrapped-correction">{hardest.correction}</p> : <p className="wrapped-correction">You didn’t miss a myth statement this round. Keep a curious eye on the claims you meet.</p>}
            {hardest && <p className="wrapped-source">{questionById.get(hardest.questionId)?.sources[0]?.title ?? "Source note"}</p>}
          </div>
        )}

        {slide === 4 && (
          <div className="wrapped-content">
            <p className="wrapped-kicker">one small takeaway</p>
            <h2>Your next note is about <em>{topicLabels[result.weakestTopic]}.</em></h2>
            <p className="wrapped-correction">{topicTakeaways[result.weakestTopic]}</p>
            <span className="wrapped-handline">one question at a time.</span>
          </div>
        )}

        {slide === 5 && (
          <div className="wrapped-content">
            <p className="wrapped-kicker">your first read</p>
            <p className="wrapped-score">{result.heroGuess}<small>%</small></p>
            <h2>You guessed.</h2>
            <p className="wrapped-correction">There isn’t one clean percentage for what’s in your control. Biology, sleep, stress, food and circumstances can all matter.</p>
            <p className="wrapped-source">Your guess is a starting thought, not a health score.</p>
          </div>
        )}

        {slide === 6 && (
          <div className="wrapped-content">
            <p className="wrapped-kicker">what matters most for someone like you</p>
            <h2>{doubtAnswer.title}<em>.</em></h2>
            <p className="wrapped-correction">{doubtAnswer.answer}</p>
            <div className="wrapped-endnote">
              <p>Educational, not medical advice. Talk to a doctor about what is right for you.</p>
              <span>steer club · a note to keep</span>
            </div>
          </div>
        )}
      </div>

      <div className="wrapped-controls">
        <button type="button" className="wrapped-arrow" onClick={() => goTo(slide - 1)} disabled={slide === 0} aria-label="Previous story card">←</button>
        <p>Tap through your note</p>
        <button type="button" className="wrapped-arrow" onClick={() => slide < 6 ? goTo(slide + 1) : onBackAction()} aria-label={slide < 6 ? "Next story card" : "Play again"}>
          {slide < 6 ? "→" : "↻"}
        </button>
      </div>
      <div className="wrapped-share-actions">
        <button type="button" onClick={shareWhatsApp} disabled={!shareable}>Share on WhatsApp</button>
        <button type="button" onClick={downloadStory}>Save 9:16 story</button>
        <button type="button" onClick={copyLink} disabled={!shareable}>Copy link</button>
      </div>
      <p className="wrapped-live" role="status" aria-live="polite">{message}</p>
      <p className="wrapped-disclaimer">Not medical advice. If a question feels personal, talk with a doctor.</p>
    </section>
  );
}
