"use client";

import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import { useEffect, useState } from "react";
import { doubtAnswers, DoubtId, GameQuestion, getSessionId, selectedDoubtFromStorage } from "@/lib/game";

type TrackerResponse = { savedDoubts?: DoubtId[]; clearedMyths?: string[] };
type QuestionPayload = { questions?: GameQuestion[] } | GameQuestion[];

const doubtLabel: Record<DoubtId, string> = {
  safe: "safe",
  "muscle-loss": "muscle loss",
  regain: "weight comes back",
  "diabetes-only": "only for diabetics",
  "for-me": "is it for me",
};

function readList<T extends string>(key: string): T[] {
  try {
    const value = JSON.parse(window.localStorage.getItem(key) ?? "[]") as unknown;
    return Array.isArray(value) ? value.filter((entry): entry is T => typeof entry === "string") : [];
  } catch { return []; }
}

export default function DoubtsTracker() {
  const [savedDoubts, setSavedDoubts] = useState<DoubtId[]>([]);
  const [clearedMyths, setClearedMyths] = useState<string[]>([]);
  const [questions, setQuestions] = useState<GameQuestion[]>([]);
  const [status, setStatus] = useState("Your private notes stay in this anonymous browser session.");

  useEffect(() => {
    const sessionId = getSessionId();
    setSavedDoubts(readList<DoubtId>("steerclub:saved-doubts"));
    setClearedMyths(readList<string>("steerclub:cleared-myths"));
    fetch("/content/questions.json", { cache: "no-store" })
      .then((response) => response.ok ? response.json() as Promise<QuestionPayload> : Promise.reject())
      .then((payload) => setQuestions(Array.isArray(payload) ? payload : payload.questions ?? []))
      .catch(() => setStatus("Your note is on this device; source cards need a connection."));
    fetch(`/api/session?id=${encodeURIComponent(sessionId)}`, { cache: "no-store" })
      .then((response) => response.ok ? response.json() as Promise<TrackerResponse> : Promise.reject())
      .then((payload) => {
        const doubts = Array.isArray(payload.savedDoubts) ? payload.savedDoubts : readList<DoubtId>("steerclub:saved-doubts");
        const myths = Array.isArray(payload.clearedMyths) ? payload.clearedMyths : readList<string>("steerclub:cleared-myths");
        setSavedDoubts(doubts);
        setClearedMyths(myths);
        window.localStorage.setItem("steerclub:saved-doubts", JSON.stringify(doubts));
        window.localStorage.setItem("steerclub:cleared-myths", JSON.stringify(myths));
        const selected = selectedDoubtFromStorage();
        if (selected && !doubts.includes(selected)) setSavedDoubts([...doubts, selected]);
      })
      .catch(() => setStatus("Showing the notes saved on this device. Connect to refresh the anonymous record."));
  }, []);

  const questionById = new Map(questions.map((question) => [question.id, question]));
  return (
    <main className="game-page tracker-page">
      <header className="game-header"><Link href="/" className="game-wordmark" aria-label="Steer Club home"><BrandMark /></Link><span>a margin you can keep</span></header>
      <section className="tracker-sheet" aria-labelledby="tracker-heading">
        <p className="game-kicker">your private page</p>
        <h1 id="tracker-heading">The notes you wanted to keep.</h1>
        <p className="tracker-intro">No account, no health profile. Just the doubts you chose and myth corrections you decided to save in this anonymous session.</p>
        <section className="tracker-section" aria-labelledby="doubts-heading">
          <p className="game-kicker">your margin notes</p>
          <h2 id="doubts-heading">Doubts worth asking about.</h2>
          {savedDoubts.length ? savedDoubts.map((id) => (
            <article className="tracker-doubt" key={id}>
              <span className="tracker-doubt-label">{doubtLabel[id]}</span>
              <p>{doubtAnswers[id].answer}</p>
            </article>
          )) : <p className="tracker-empty">Choose a doubt before a round and it will be kept here.</p>}
        </section>
        <section className="tracker-section" aria-labelledby="myths-heading">
          <p className="game-kicker">the jar on your shelf</p>
          <h2 id="myths-heading">Myths you cleared.</h2>
          {clearedMyths.length ? clearedMyths.map((id) => {
            const question = questionById.get(id);
            if (!question) return null;
            return (
              <article className="tracker-myth" key={id}>
                <p className="tracker-myth-claim">“{question.claim}”</p>
                <p>{question.explanation}</p>
                <details className="source-drawer">
                  <summary>Read the sources ({question.sources.length})</summary>
                  <ul>{question.sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.title} ↗</a><span>{source.supports}</span></li>)}</ul>
                </details>
              </article>
            );
          }) : <p className="tracker-empty">When a myth gets an explanation, tap “keep this note” to put it in your jar.</p>}
        </section>
        <p className="game-save-note" role="status" aria-live="polite">{status}</p>
        <Link className="game-challenge-button tracker-play-link" href="/play">Back to the game <span aria-hidden="true">→</span></Link>
        <p className="game-disclaimer">Learning only—not medical advice. Talk with a doctor about what fits you.</p>
      </section>
    </main>
  );
}
