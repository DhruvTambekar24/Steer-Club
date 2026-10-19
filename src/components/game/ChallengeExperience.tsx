"use client";

import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DoubtId, GameMode, getSessionId, selectedDoubtFromStorage } from "@/lib/game";
import { trackEvent } from "@/lib/analytics";

type ChallengeData = {
  id: string;
  state: "waiting" | "completed";
  mode: Exclude<GameMode, "daily">;
  firstName: string | null;
  questionIds: string[];
  sender: { score: number; total: number };
  friend: { score: number; total: number } | null;
  mySide: "sender" | "friend" | "visitor";
  habitsStartOn: string | null;
  checkins: { sender: number[]; friend: number[] };
};

const doubts: { id: DoubtId; label: string }[] = [
  { id: "safe", label: "safe" },
  { id: "muscle-loss", label: "muscle loss" },
  { id: "regain", label: "weight comes back" },
  { id: "diabetes-only", label: "only for diabetics" },
  { id: "for-me", label: "is it for me" },
];

const habits = [
  { day: 1, title: "A 10-minute after-dinner walk", note: "An ordinary bit of movement. No pace or performance score." },
  { day: 2, title: "Add a protein food at breakfast", note: "Dal, paneer, curd, sprouts, soy or eggs—what fits your table." },
  { day: 3, title: "Screens off 30 minutes before bed", note: "A small chance to make room for a calmer bedtime." },
];

type Payload = { id?: string; error?: string };

export default function ChallengeExperience({ id }: { id: string }) {
  const [sessionId, setSessionId] = useState("");
  const [doubt, setDoubt] = useState<DoubtId | null>(null);
  const [data, setData] = useState<ChallengeData | null>(null);
  const [busyDay, setBusyDay] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async (signal?: AbortSignal) => {
    if (!sessionId) return;
    try {
      const response = await fetch(`/api/challenges/${encodeURIComponent(id)}?sessionId=${encodeURIComponent(sessionId)}`, { cache: "no-store", signal });
      const payload = await response.json() as ChallengeData & Payload;
      if (!response.ok) throw new Error(payload.error ?? "The challenge note is unavailable.");
      setData(payload);
      setError("");
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "The challenge note is unavailable.");
    } finally {
      setLoading(false);
    }
  }, [id, sessionId]);

  useEffect(() => {
    const current = getSessionId();
    setSessionId(current);
    setDoubt(selectedDoubtFromStorage());
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    const controller = new AbortController();
    void refresh(controller.signal);
    return () => controller.abort();
  }, [refresh, sessionId]);

  useEffect(() => {
    if (!sessionId || data?.state !== "waiting") return;
    const timer = window.setInterval(() => void refresh(), 5000);
    return () => window.clearInterval(timer);
  }, [data?.state, refresh, sessionId]);

  const viewerCheckins = useMemo(() => {
    if (!data) return [];
    return data.mySide === "sender" ? data.checkins.sender : data.checkins.friend;
  }, [data]);
  const today = new Date().toISOString().slice(0, 10);
  const currentHabitDay = data?.habitsStartOn
    ? Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${data.habitsStartOn}T00:00:00Z`)) / 86400000) + 1
    : 0;
  const senderScoreLabel = data?.mySide === "sender" ? "You" : data?.firstName || (data?.mySide === "visitor" ? "Sender" : "Your friend");
  const friendScoreLabel = data?.mySide === "friend" ? "You" : data?.mySide === "visitor" ? "Friend" : "Your friend";

  function chooseDoubt(next: DoubtId) {
    setDoubt(next);
    try { window.localStorage.setItem("steerclub:doubt", next); } catch { /* optional on this device */ }
  }

  async function shareChallenge() {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: "A note from Steer Club", text: "Can you beat this seven-note round?", url });
      else {
        await navigator.clipboard.writeText(url);
        setMessage("Your challenge link is copied.");
      }
      trackEvent("share_clicked", { channel: "challenge-share" });
    } catch { setMessage("Your challenge is ready to share whenever you are."); }
  }

  function joinChallenge() {
    if (!data || !doubt) {
      setMessage("Choose the doubt you want kept in the margin first.");
      return;
    }
    const orderedIds = data.questionIds.map((questionId) => encodeURIComponent(questionId)).join(",");
    trackEvent("challenge_joined", { challengeId: id });
    window.location.assign(`/play?mode=${encodeURIComponent(data.mode)}&challenge=${encodeURIComponent(id)}&questions=${orderedIds}`);
  }

  async function checkIn(day: number) {
    if (!sessionId) return;
    setBusyDay(day);
    setMessage("");
    try {
      const response = await fetch(`/api/challenges/${encodeURIComponent(id)}/checkins`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, habitDay: day }),
      });
      const payload = await response.json() as Payload;
      if (!response.ok) throw new Error(payload.error ?? "That check-in did not save.");
      setMessage("Your check-in is on the shared note.");
      await refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "That check-in did not save.");
    } finally {
      setBusyDay(null);
    }
  }

  function remindOnWhatsApp() {
    const text = `Our Steer Club three-day habit is here if you want to check in: ${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
    setMessage("WhatsApp opened for you to choose whether to send the reminder.");
  }

  if (loading) return <main className="game-page"><p className="game-loading">Unfolding the friend note…</p></main>;

  return (
    <main className="game-page challenge-page">
      <header className="game-header"><Link href="/" className="game-wordmark" aria-label="Steer Club home"><BrandMark /></Link><span>a note passed between friends</span></header>
      <section className="challenge-sheet" aria-labelledby="challenge-title">
        <p className="game-kicker">a shared note · no leaderboard</p>
        {data ? (
          <>
            <h1 id="challenge-title">{data.mySide === "sender" ? `You cracked ${data.sender.score}/${data.sender.total}.` : data.firstName ? `${data.firstName} cracked ${data.sender.score}/${data.sender.total}.` : `Someone cracked ${data.sender.score}/${data.sender.total}.`} <em>{data.mySide === "sender" ? "Your friend has the other note." : "Can you beat it?"}</em></h1>
            {data.state === "waiting" ? (
              <>
                <p className="challenge-intro">Same seven questions, in the same order. Choose your own doubt; two notes will address it. Your answers stay an anonymous learning result.</p>
                {data.mySide === "sender" ? (
                  <div className="challenge-waiting">
                    <span className="challenge-stitch" aria-hidden="true">··········</span>
                    <p>Your note is out. This page will show the comparison when your friend finishes.</p>
                    <button className="game-challenge-button" type="button" onClick={() => void shareChallenge()}>Share the link <span aria-hidden="true">↗</span></button>
                  </div>
                ) : (
                  <>
                    {!doubt ? (
                      <div className="challenge-doubt">
                        <p>First, what’s your biggest doubt right now?</p>
                        <div className="doubt-options game-doubt-options" role="group" aria-label="Choose your biggest doubt">
                          {doubts.map((item) => <button key={item.id} type="button" className="doubt-chip" onClick={() => chooseDoubt(item.id)}>{item.label}</button>)}
                        </div>
                      </div>
                    ) : <p className="challenge-selected-doubt">In your margin: <em>{doubts.find((item) => item.id === doubt)?.label}</em>. Two of the seven notes will speak to it.</p>}
                    <button className="game-challenge-button" type="button" onClick={joinChallenge} disabled={!doubt}>Take the same seven notes <span aria-hidden="true">→</span></button>
                  </>
                )}
                <p className="challenge-poll-note">This page checks quietly for a friend’s result while it stays open.</p>
              </>
            ) : (
              <>
                <p className="challenge-intro">Seven shared questions, one order. Compare the round—not each other’s health.</p>
                <div className="challenge-score-pair" aria-label="Side-by-side challenge scores">
                  <div><span>{senderScoreLabel}</span><strong>{data.sender.score}<small>/{data.sender.total}</small></strong></div>
                  <b aria-hidden="true">&amp;</b>
                  <div><span>{friendScoreLabel}</span><strong>{data.friend?.score ?? "—"}<small>/{data.friend?.total ?? data.sender.total}</small></strong></div>
                </div>
                <p className="challenge-score-caption">A score in a game, not a score for your body.</p>
                <section className="habit-section" aria-labelledby="habit-title">
                  <p className="game-kicker">three days · together, at your own pace</p>
                  <h2 id="habit-title">A small habit, shared.</h2>
                  <p>Only the two people in this challenge can check in. Nothing gets sent automatically.</p>
                  <div className="habit-list">
                    {habits.map((habit) => {
                      const mine = viewerCheckins.includes(habit.day);
                      const friendHas = (data.mySide === "sender" ? data.checkins.friend : data.checkins.sender).includes(habit.day);
                      const available = data.mySide !== "visitor" && currentHabitDay === habit.day;
                      return (
                        <article className={`habit-note${mine ? " is-checked" : ""}`} key={habit.day}>
                          <div className="habit-day-stamp">day {habit.day}<span aria-hidden="true">{mine ? "✓" : "·"}</span></div>
                          <div className="habit-copy"><h3>{habit.title}</h3><p>{habit.note}</p><small>{mine ? "your check-in is here" : friendHas ? "your friend checked in" : available ? "ready for today" : "a gentle note for another day"}</small></div>
                          <button type="button" className="habit-check" disabled={!available || mine || busyDay !== null} onClick={() => void checkIn(habit.day)} aria-label={`Check in for day ${habit.day}`}>
                            {busyDay === habit.day ? "…" : mine ? "done" : available ? "I did this" : "·"}
                          </button>
                        </article>
                      );
                    })}
                  </div>
                  {data.mySide !== "visitor" && <button className="whatsapp-reminder" type="button" onClick={remindOnWhatsApp}>Remind each other on WhatsApp <span aria-hidden="true">↗</span></button>}
                </section>
              </>
            )}
          </>
        ) : <h1 id="challenge-title">The friend note has wandered off.</h1>}
        {error && <p className="game-save-note" role="status">{error}</p>}
        {message && <p className="game-save-note" role="status" aria-live="polite">{message}</p>}
        <p className="game-disclaimer">Educational, not medical advice. This page cannot assess your health or decide what fits you.</p>
        <Link className="game-link" href="/play">Open today’s note <span aria-hidden="true">↗</span></Link>
      </section>
    </main>
  );
}
