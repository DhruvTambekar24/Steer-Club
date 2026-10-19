"use client";

import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import { useCallback, useEffect, useRef, useState } from "react";
import PWAInstallPrompt from "@/components/game/PWAInstallPrompt";
import WrappedStory from "@/components/game/WrappedStory";
import { captureUtm, getCapturedUtm, trackEvent } from "@/lib/analytics";
import {
  AnswerRecord,
  DoubtId,
  GameMode,
  GameQuestion,
  GameResult,
  getHardestBelievedMyth,
  getSessionId,
  selectChallengeQuestions,
  selectedDoubtFromStorage,
  selectQuestions,
  scoreTopics,
  utcDateKey,
} from "@/lib/game";

const doubtChoices: { id: DoubtId; label: string }[] = [
  { id: "safe", label: "safe" },
  { id: "muscle-loss", label: "muscle loss" },
  { id: "regain", label: "weight comes back" },
  { id: "diabetes-only", label: "only for diabetics" },
  { id: "for-me", label: "is it for me" },
];

const modeOptions: { id: GameMode; label: string; description: string }[] = [
  { id: "quick-quiz", label: "Quick quiz", description: "7 questions · about 2 minutes" },
  { id: "myth-fact", label: "Myth vs fact", description: "7 claims · tap or swipe" },
  { id: "daily", label: "Today’s puzzle", description: "5 notes · same for everyone today" },
];

type Screen = "setup" | "playing" | "wrapped";
type QuestionPayload = { questions?: GameQuestion[] } | GameQuestion[];

function currentModeFromUrl(): GameMode | null {
  const mode = new URLSearchParams(window.location.search).get("mode");
  return mode === "quick-quiz" || mode === "myth-fact" || mode === "daily" ? mode : null;
}

export default function GameExperience() {
  const [questions, setQuestions] = useState<GameQuestion[]>([]);
  const [bankState, setBankState] = useState<"loading" | "ready" | "error">("loading");
  const [selectedDoubt, setSelectedDoubt] = useState<DoubtId | null>(null);
  const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);
  const [mode, setMode] = useState<GameMode>("quick-quiz");
  const [screen, setScreen] = useState<Screen>("setup");
  const [round, setRound] = useState<GameQuestion[]>([]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [selection, setSelection] = useState<{ index: number; correct: boolean } | null>(null);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [result, setResult] = useState<GameResult | null>(null);
  const [shareable, setShareable] = useState(false);
  const [saveNotice, setSaveNotice] = useState("");
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [challengeQuestionIds, setChallengeQuestionIds] = useState<string[]>([]);
  const [challengeRound, setChallengeRound] = useState(false);
  const [challengeCompleted, setChallengeCompleted] = useState(false);
  const [challengeFirstName, setChallengeFirstName] = useState("");
  const [challengeLink, setChallengeLink] = useState("");
  const [savedDoubts, setSavedDoubts] = useState<DoubtId[]>([]);
  const [clearedMyths, setClearedMyths] = useState<string[]>([]);
  const [embed, setEmbed] = useState(false);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [streakCalendar, setStreakCalendar] = useState<string[]>([]);
  const [graceAvailable, setGraceAvailable] = useState(true);
  const [nextMilestone, setNextMilestone] = useState(3);
  const [returning, setReturning] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const startTimeRef = useRef<number>(Date.now());
  const swipeStartRef = useRef<number | null>(null);
  const activeQuestion = round[roundIndex];
  const expectedAnswer = activeQuestion
    ? mode === "myth-fact"
      ? activeQuestion.mythFactAnswer === "myth" ? 0 : 1
      : activeQuestion.correctIndex
    : 0;

  useEffect(() => {
    captureUtm();
    let cancelled = false;
    setSelectedDoubt(selectedDoubtFromStorage());
    const savedGuess = Number(window.localStorage.getItem("steerclub:guess"));
    const guess = Number.isFinite(savedGuess) && savedGuess >= 0 && savedGuess <= 100 ? savedGuess : 50;
    window.localStorage.setItem("steerclub:guess", String(guess));
    setEmbed(new URLSearchParams(window.location.search).get("embed") === "1");
    setSelectedMode(currentModeFromUrl());
    const params = new URLSearchParams(window.location.search);
    const incomingChallenge = params.get("challenge");
    const incomingIds = params.get("questions")?.split(",").filter((id) => /^[a-z0-9-]{1,64}$/.test(id)) ?? [];
    if (incomingChallenge && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(incomingChallenge)) {
      setChallengeId(incomingChallenge);
      setChallengeRound(true);
      setChallengeQuestionIds(incomingIds);
    }
    getSessionId();

    fetch("/content/questions.json", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("Question bank could not be loaded.");
        return response.json() as Promise<QuestionPayload>;
      })
      .then((data) => {
        const list = Array.isArray(data) ? data : data.questions ?? [];
        if (list.length < 30) throw new Error("The question bank is incomplete.");
        if (!cancelled) {
          setQuestions(list);
          setBankState("ready");
        }
      })
      .catch(() => {
        if (!cancelled) setBankState("error");
      });

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (bankState !== "ready" || !selectedDoubt || !selectedMode || screen !== "setup") return;
    beginRound(selectedMode, selectedDoubt);
    // Begin once from the URL or a tap; later screens are managed by event handlers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bankState, challengeId, challengeQuestionIds, selectedDoubt, selectedMode, screen]);

  useEffect(() => {
    const sessionId = window.localStorage.getItem("steerclub:anonymous-session");
    if (!sessionId) return;
    fetch(`/api/session?id=${encodeURIComponent(sessionId)}`, { cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        if (!data) return;
        if (typeof data.streak === "number") setStreak(data.streak);
        if (typeof data.bestStreak === "number") setBestStreak(data.bestStreak);
        if (Array.isArray(data.calendar)) setStreakCalendar(data.calendar.filter((date: unknown): date is string => typeof date === "string"));
        if (typeof data.graceAvailable === "boolean") setGraceAvailable(data.graceAvailable);
        if (typeof data.nextMilestone === "number") setNextMilestone(data.nextMilestone);
        if (typeof data.returning === "boolean") setReturning(data.returning);
        let localDoubts: DoubtId[] = [];
        let localMyths: string[] = [];
        try {
          const rawDoubts = JSON.parse(window.localStorage.getItem("steerclub:saved-doubts") ?? "[]") as unknown;
          if (Array.isArray(rawDoubts)) localDoubts = rawDoubts.filter((item): item is DoubtId => doubtChoices.some((choice) => choice.id === item));
          const rawMyths = JSON.parse(window.localStorage.getItem("steerclub:cleared-myths") ?? "[]") as unknown;
          if (Array.isArray(rawMyths)) localMyths = rawMyths.filter((item): item is string => typeof item === "string");
        } catch { /* malformed optional local history is ignored */ }
        const serverSaved = Array.isArray(data.savedDoubts)
          ? data.savedDoubts.filter((item: unknown): item is DoubtId => doubtChoices.some((choice) => choice.id === item))
          : [];
        const current = selectedDoubtFromStorage();
        const saved = [...new Set([...serverSaved, ...localDoubts, ...(current ? [current] : [])])];
        const serverMyths = Array.isArray(data.clearedMyths)
          ? data.clearedMyths.filter((item: unknown): item is string => typeof item === "string")
          : [];
        const myths = [...new Set([...serverMyths, ...localMyths])];
        setSavedDoubts(saved);
        setClearedMyths(myths);
        window.localStorage.setItem("steerclub:saved-doubts", JSON.stringify(saved));
        window.localStorage.setItem("steerclub:cleared-myths", JSON.stringify(myths));
        if (saved.length !== serverSaved.length || myths.length !== serverMyths.length) persistTracker(saved, myths);
      })
      .catch(() => undefined);
  }, []);

  function beginRound(nextMode: GameMode, doubt: DoubtId, forceChallengeRound = false) {
    try {
      const dateKey = utcDateKey();
      const isSharedRound = forceChallengeRound || Boolean(challengeId);
      if (challengeId && challengeQuestionIds.length !== 7) throw new Error("This friend challenge link is missing its shared question order.");
      const chosen = isSharedRound
        ? selectChallengeQuestions(questions, doubt, dateKey, challengeId ? challengeQuestionIds : undefined)
        : selectQuestions(questions, nextMode, doubt, dateKey);
      setMode(nextMode);
      setRound(chosen);
      setRoundIndex(0);
      setAnswers([]);
      setSelection(null);
      setCombo(0);
      setBestCombo(0);
      setResult(null);
      setSaveNotice("");
      setShareable(false);
      setChallengeRound(isSharedRound);
      setChallengeCompleted(false);
      setChallengeLink("");
      setSelectedMode(nextMode);
      setScreen("playing");
      startTimeRef.current = performance.now();
      trackEvent("mode_selected", { mode: nextMode });
      const payload = { mode: nextMode, dateKey, questionIds: chosen.map((question) => question.id), doubt, challengeId, challengeRound: isSharedRound };
      window.localStorage.setItem("steerclub:active-round", JSON.stringify(payload));
    } catch {
      setSaveNotice("This round needs its shared questions. Return to the friend note or reload the question cards.");
    }
  }

  function chooseDoubt(id: DoubtId) {
    setSelectedDoubt(id);
    try { window.localStorage.setItem("steerclub:doubt", id); } catch { /* optional local preference */ }
    const nextDoubts = [...new Set([...savedDoubts, id])];
    setSavedDoubts(nextDoubts);
    persistTracker(nextDoubts, clearedMyths);
    if (selectedMode && bankState === "ready") beginRound(selectedMode, id);
  }

  function persistTracker(doubts: DoubtId[], myths: string[]) {
    try {
      window.localStorage.setItem("steerclub:saved-doubts", JSON.stringify(doubts));
      window.localStorage.setItem("steerclub:cleared-myths", JSON.stringify(myths));
    } catch { /* browser storage is optional */ }
    void fetch("/api/session", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: getSessionId(), savedDoubts: doubts, clearedMyths: myths }),
    }).catch(() => undefined);
  }

  function saveMythToJar(questionId: string) {
    if (clearedMyths.includes(questionId)) return;
    const nextMyths = [...clearedMyths, questionId];
    setClearedMyths(nextMyths);
    persistTracker(savedDoubts, nextMyths);
  }

  function tapHaptic() {
    if ("vibrate" in navigator) navigator.vibrate(10);
    if (!soundOn) return;
    try {
      const AudioContextConstructor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextConstructor) return;
      const context = new AudioContextConstructor();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(640, context.currentTime);
      gain.gain.setValueAtTime(0.0001, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.025, context.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.07);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.08);
      oscillator.onended = () => { void context.close(); };
    } catch { /* audio is optional; touch feedback still works */ }
  }

  function answer(index: number) {
    if (!activeQuestion || selection) return;
    const correct = index === expectedAnswer;
    const elapsedMs = Math.max(0, Math.round(performance.now() - startTimeRef.current));
    const record: AnswerRecord = { questionId: activeQuestion.id, selectedIndex: index, correct, elapsedMs };
    setAnswers((previous) => [...previous, record]);
    setSelection({ index, correct });
    const nextCombo = correct ? combo + 1 : 0;
    setCombo(nextCombo);
    setBestCombo((previous) => Math.max(previous, nextCombo));
    trackEvent("question_answered", { mode, questionId: activeQuestion.id, correct, elapsedMs });
    tapHaptic();
  }

  const saveResult = useCallback(async (records: AnswerRecord[]) => {
    if (!selectedDoubt) return;
    const sessionId = getSessionId();
    const currentResultId = `local-${window.crypto?.randomUUID?.() ?? Date.now().toString(36)}`;
    const topicScore = scoreTopics(round, records);
    const score = records.filter((record) => record.correct).length;
    const draft: GameResult = {
      id: currentResultId,
      sessionId,
      mode,
      dateKey: utcDateKey(),
      score,
      total: round.length,
      answers: records,
      topicScores: topicScore.scores,
      weakestTopic: topicScore.weakestTopic,
      hardestBelievedMyth: getHardestBelievedMyth(round, records),
      heroGuess: Number(window.localStorage.getItem("steerclub:guess") ?? 50),
      selectedDoubt,
      finishedAt: new Date().toISOString(),
    };
    window.localStorage.setItem("steerclub:last-result", JSON.stringify(draft));
    setResult(draft);
    setScreen("wrapped");
    trackEvent("game_completed", { mode, score, total: round.length, weakestTopic: topicScore.weakestTopic });
    trackEvent("wrapped_viewed", { mode, score, total: round.length });

    try {
      const response = await fetch("/api/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          mode,
          dateKey: draft.dateKey,
          score,
          total: round.length,
          answers: records,
          topicScores: topicScore.scores,
          weakestTopic: topicScore.weakestTopic,
          hardestBelievedMyth: draft.hardestBelievedMyth,
          heroGuess: draft.heroGuess,
          selectedDoubt,
          questionIds: round.map((question) => question.id),
          challengeId,
          challengeRound,
          utm: readUtm(),
        }),
      });
      if (!response.ok) throw new Error("Could not save this result.");
      const saved = await response.json() as { id: string; streak?: number; challengeCompleted?: boolean };
      if (saved.id) {
        const published = { ...draft, id: saved.id };
        window.localStorage.setItem("steerclub:last-result", JSON.stringify(published));
        setResult(published);
        setShareable(true);
      }
      if (typeof saved.streak === "number") setStreak(saved.streak);
      if (typeof saved.challengeCompleted === "boolean") {
        setChallengeCompleted(saved.challengeCompleted);
        if (saved.challengeCompleted) trackEvent("challenge_completed", { challengeId: challengeId ?? "joined" });
      }
      setSaveNotice("Your note is saved to this anonymous session.");
    } catch {
      setShareable(false);
      setSaveNotice("Saved on this device only for now. Your share link will be available when the connection returns.");
    }
  }, [challengeId, challengeRound, mode, round, selectedDoubt]);

  function nextQuestion() {
    if (!selection) return;
    if (roundIndex + 1 < round.length) {
      setRoundIndex((index) => index + 1);
      setSelection(null);
      startTimeRef.current = performance.now();
      return;
    }
    void saveResult(answers);
  }

  function startFairChallengeRound() {
    if (!selectedDoubt || !shareable) return;
    const challengeMode = mode === "daily" ? "quick-quiz" : mode;
    setChallengeId(null);
    setChallengeQuestionIds([]);
    setChallengeRound(true);
    setChallengeCompleted(false);
    beginRound(challengeMode, selectedDoubt, true);
  }

  async function createChallenge() {
    if (!result || !shareable || !challengeRound || challengeId) return;
    setSaveNotice("Writing the friend note…");
    try {
      const response = await fetch("/api/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: getSessionId(), resultId: result.id, firstName: challengeFirstName.trim() || undefined }),
      });
      const payload = await response.json() as { id?: string; error?: string };
      if (!response.ok || !payload.id) throw new Error(payload.error ?? "The challenge link could not be made.");
      const url = `${window.location.origin}/c/${encodeURIComponent(payload.id)}`;
      setChallengeId(payload.id);
      trackEvent("challenge_created", { challengeId: payload.id });
      setChallengeLink(url);
      try {
        await navigator.clipboard.writeText(url);
        setSaveNotice("The friend link is copied. No phone number needed.");
      } catch {
        setSaveNotice("Your friend link is ready below. No phone number needed.");
      }
    } catch (error) {
      setSaveNotice(error instanceof Error ? error.message : "The friend note could not be made right now.");
    }
  }

  function onCardPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (mode === "myth-fact" && !selection) swipeStartRef.current = event.clientX;
  }

  function onCardPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (mode !== "myth-fact" || selection || swipeStartRef.current === null) return;
    const difference = event.clientX - swipeStartRef.current;
    swipeStartRef.current = null;
    if (Math.abs(difference) > 54) answer(difference < 0 ? 0 : 1);
  }

  function readUtm(): Record<string, string> {
    return getCapturedUtm();
  }

  if (bankState === "loading") return <main className="game-page"><p className="game-loading">Opening the note…</p></main>;
  if (bankState === "error") return <main className="game-page"><h1>The question cards aren’t here yet.</h1><p>Please refresh in a moment. Your guess and doubt stay on this device.</p><Link className="game-link" href="/">Back to the note</Link></main>;

  const questionCount = round.length;
  const answeredCount = answers.length;
  const selectedLabel = doubtChoices.find((item) => item.id === selectedDoubt)?.label;

  if (screen === "wrapped" && result) {
    return (
      <main className={`game-page${embed ? " game-page-embed" : ""}`}>
        {!embed && <header className="game-header"><Link href="/" className="game-wordmark" aria-label="Steer Club home"><BrandMark /></Link><span>your note, folded</span></header>}
        <WrappedStory result={result} questions={round} shareable={shareable} onBackAction={() => { setScreen("setup"); setSelectedMode(null); setResult(null); setShareable(false); setChallengeId(null); setChallengeQuestionIds([]); setChallengeRound(false); setChallengeCompleted(false); setChallengeLink(""); }} />
        <div className="wrapped-care-cta"><p>A question still on your mind?</p><Link href="/care">Explore your care options <span aria-hidden="true">→</span></Link></div>
        <div className="game-after-wrapped">
          <p className="game-save-note" role="status" aria-live="polite">{saveNotice}</p>
          {shareable && !challengeRound && !challengeId && (
            <div className="challenge-next-step">
              <button className="game-challenge-button" type="button" onClick={startFairChallengeRound}>Set a fair friend challenge <span aria-hidden="true">→</span></button>
              <p className="game-small-note">You’ll play the same seven-note pack first, so the comparison is fair. No phone number needed.</p>
            </div>
          )}
          {shareable && challengeRound && !challengeId && (
            <div className="challenge-create-form">
              <label htmlFor="challenge-first-name">First name for the invite <span>(optional)</span></label>
              <input id="challenge-first-name" autoComplete="given-name" maxLength={40} value={challengeFirstName} onChange={(event) => setChallengeFirstName(event.target.value)} placeholder="Leave blank to stay unnamed" />
              <button className="game-challenge-button" type="button" onClick={() => void createChallenge()}>Make my friend link <span aria-hidden="true">↗</span></button>
              <p className="game-small-note">Your first name is optional. We never ask for your friend’s number or send a message.</p>
            </div>
          )}
          {challengeId && (challengeLink || challengeCompleted) && (
            <div className="challenge-created-note">
              <p>{challengeCompleted ? "Both notes are in. The shared habit is open." : "Your seven-note challenge is ready."}</p>
              {challengeLink && <p className="challenge-url">{challengeLink}</p>}
              <Link className="game-challenge-button" href={`/c/${encodeURIComponent(challengeId)}`}>{challengeCompleted ? "See the shared note" : "Open the friend note"} <span aria-hidden="true">→</span></Link>
            </div>
          )}
        </div>
      </main>
    );
  }

  if (screen === "playing" && activeQuestion) {
    const mythFact = mode === "myth-fact";
    const options = mythFact ? ["myth", "fact"] : activeQuestion.options;
    const prompt = mythFact ? activeQuestion.claim : activeQuestion.prompt;
    const rightLabel = roundIndex + 1 === questionCount ? "Fold into my note" : "Next note";
    const mythFactCorrect = activeQuestion.mythFactAnswer === "myth" ? 0 : 1;
    const correctIndex = mythFact ? mythFactCorrect : activeQuestion.correctIndex;

    return (
      <main className={`game-page${embed ? " game-page-embed" : ""}`}>
        {!embed && <header className="game-header"><Link href="/" className="game-wordmark" aria-label="Steer Club home"><BrandMark /></Link><span>{selectedLabel ? `in the margin: ${selectedLabel}` : "a little learning, no score for your health"}</span></header>}
        <section className="question-run" aria-label={mythFact ? "Myth versus fact round" : "Quick quiz round"}>
          <div className="question-run-top">
            <p className="game-kicker">{mode === "daily" ? "today’s five-note puzzle" : challengeRound ? "same seven notes, shared order" : "seven notes, one at a time"}</p>
            <button className="sound-toggle" type="button" onClick={() => setSoundOn((value) => !value)} aria-pressed={soundOn} aria-label={soundOn ? "Turn paper sound off" : "Turn paper sound on"}>{soundOn ? "♪ sound on" : "sound off"}</button>
          </div>
          <div className="stitched-progress" aria-label={`Question ${roundIndex + 1} of ${questionCount}`}>
            {round.map((item, index) => <span key={item.id} className={index < answeredCount ? "done" : index === roundIndex ? "current" : ""} />)}
          </div>
          <div className="question-meta"><span>note {String(roundIndex + 1).padStart(2, "0")}</span><span>{activeQuestion.topic}</span></div>
          <div className="question-card" onPointerDown={onCardPointerDown} onPointerUp={onCardPointerUp} onPointerCancel={() => { swipeStartRef.current = null; }}>
            <div className="question-card-paper" aria-live="polite">
              <span className="question-corner" aria-hidden="true">✳</span>
              <p className="question-prompt">{prompt}</p>
              {mythFact && !selection && <p className="swipe-hint">← swipe for myth · fact →</p>}
              <div className={mythFact ? "answer-options myth-options" : "answer-options"} role="group" aria-label={mythFact ? "Choose whether the claim is myth or fact" : "Choose an answer"}>
                {options.map((option, index) => {
                  const isSelected = selection?.index === index;
                  const isCorrect = selection !== null && index === correctIndex;
                  const className = `answer-option${isSelected ? " selected" : ""}${isCorrect ? " correct" : ""}${selection && isSelected && !selection.correct ? " incorrect" : ""}`;
                  return (
                    <button key={`${activeQuestion.id}-${index}`} type="button" className={className} onClick={() => answer(index)} disabled={selection !== null} aria-pressed={isSelected}>
                      <span className="answer-mark">{mythFact ? index === 0 ? "←" : "→" : String.fromCharCode(65 + index)}</span>
                      <span>{mythFact ? option : option}</span>
                      {isCorrect && <span className="answer-stamp" aria-label="Correct">right</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {selection && (
            <section className={`explanation-sheet${selection.correct ? " is-correct" : " is-review"}`} aria-live="polite" aria-labelledby="answer-heading">
              <p className="explanation-verdict" id="answer-heading">{selection.correct ? "That’s the note." : "A good one to keep."}</p>
              <p>{activeQuestion.explanation}</p>
              {activeQuestion.caveat && <p className="explanation-caveat">{activeQuestion.caveat}</p>}
              <details className="source-drawer">
                <summary>Read the sources ({activeQuestion.sources.length})</summary>
                <ul>{activeQuestion.sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.title} ↗</a><span>{source.supports}</span></li>)}</ul>
              </details>
              {mode === "myth-fact" && activeQuestion.verdict === "myth" && <button className="keep-myth-button" type="button" onClick={() => saveMythToJar(activeQuestion.id)} aria-pressed={clearedMyths.includes(activeQuestion.id)}>{clearedMyths.includes(activeQuestion.id) ? "Kept in your cleared-myth jar" : "Keep this myth in my cleared jar"}</button>}
              <button type="button" className="next-question-button" onClick={nextQuestion}>{rightLabel} <span aria-hidden="true">→</span></button>
            </section>
          )}
          <div className="combo-stack" aria-label={`${combo} correct answers in a row`}>
            <div className="paper-stack" aria-hidden="true"><i /><i /><i /><i /></div>
            <span>{combo > 1 ? `${combo} notes in a row` : "your paper stack grows with each right answer"}</span>
          </div>
          <p className="game-disclaimer">Learning only—not medical advice. Talk with a doctor about what fits you.</p>
        </section>
      </main>
    );
  }

  return (
    <main className={`game-page${embed ? " game-page-embed" : ""}`}>
      {!embed && <header className="game-header"><Link href="/" className="game-wordmark" aria-label="Steer Club home"><BrandMark /></Link><span>the note, turned over</span></header>}
      <section className="game-setup">
        {returning && <p className="returning-note">{streak > 0 ? `Welcome back, day ${streak}. Your thread is still here.` : "Welcome back. Your thread is still here."}</p>}
        <p className="game-kicker">{selectedDoubt ? "your question is in the margin" : "one tap before we begin"}</p>
        {!selectedDoubt ? (
          <>
            <h1>what’s your biggest doubt right now?</h1>
            <p className="setup-intro">Pick the question you want us to keep beside the game. Two notes and the final card will speak to it.</p>
            <div className="doubt-options game-doubt-options" role="group" aria-label="Choose your biggest doubt">
              {doubtChoices.map((item) => <button className="doubt-chip" key={item.id} type="button" onClick={() => chooseDoubt(item.id)}>{item.label}</button>)}
            </div>
          </>
        ) : (
          <>
            <h1>Pick up the thread.</h1>
            <p className="setup-intro">Two of your questions will speak to <em>{selectedLabel}</em>. The rest are drawn from today’s shared note. No account, no health score.</p>
            {modeOptions.map((item) => (
              <button className="game-mode-card" key={item.id} type="button" onClick={() => beginRound(item.id, selectedDoubt)}>
                <span><strong>{item.label}</strong><small>{item.description}</small></span><span className="mode-arrow" aria-hidden="true">→</span>
              </button>
            ))}
            <div className="game-utility-card">
              <p><strong>{streak} day{streak === 1 ? "" : "s"}</strong> on your thread</p>
              <p>{bestStreak ? `Best thread: ${bestStreak} days.` : "Your private thread begins with today’s note."} {graceAvailable ? "A weekly grace day is still in the drawer." : "This week’s grace day has been used."}</p>
              <Link href="/">Back to the note <span aria-hidden="true">↗</span></Link>
              <Link href="/doubts">Open my margin notes <span aria-hidden="true">↗</span></Link>
            </div>
            <section className="streak-calendar-card" aria-label="Your last fourteen daily puzzle days">
              <div className="streak-calendar-top"><strong>{streak} day{streak === 1 ? "" : "s"} on the thread</strong><span>next note-stitch: {nextMilestone}</span></div>
              <div className="streak-days">{Array.from({ length: 14 }, (_, index) => {
                const date = new Date(Date.now() - (13 - index) * 86400000).toISOString().slice(0, 10);
                const done = streakCalendar.includes(date);
                const today = date === new Date().toISOString().slice(0, 10);
                return <span key={date} className={`streak-day${done ? " is-done" : ""}${today ? " is-today" : ""}`} aria-label={`${date}${done ? ", daily note completed" : ", no daily note completed"}`}>{new Date(`${date}T00:00:00Z`).getUTCDate()}</span>;
              })}</div>
              <p className="streak-calendar-note">{graceAvailable ? "One grace day is available this week." : "Your grace day has been used this week."} Best thread: {bestStreak}. Next note-stitch at {nextMilestone}.</p>
            </section>
            <PWAInstallPrompt />
          </>
        )}
        {saveNotice && <p className="game-save-note" role="status" aria-live="polite">{saveNotice}</p>}
        <p className="game-disclaimer">Educational, not medical advice. If a question feels personal, talk to a doctor.</p>
      </section>
    </main>
  );
}
