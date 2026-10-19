"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { captureUtm, getCapturedUtm, trackEvent } from "@/lib/analytics";
import { DoubtId, GameResult, getSessionId, selectedDoubtFromStorage } from "@/lib/game";
import BrandMark from "@/components/BrandMark";

const doubts: { id: DoubtId; label: string; answer: string }[] = [
  { id: "safe", label: "Is it safe?", answer: "Safety depends on the specific approach and your health history. Side effects can happen, and a qualified clinician should review your situation and other medicines before discussing options." },
  { id: "muscle-loss", label: "Will I lose muscle?", answer: "Any weight loss can include lean tissue as well as fat. Enough protein and strength work may help preserve muscle for some people; your needs and results can vary." },
  { id: "regain", label: "Will the weight come back?", answer: "Weight can return when support or a change stops. That is not a personal failure. Ongoing habits and follow-up may matter, and what helps differs from person to person." },
  { id: "diabetes-only", label: "Is this only for diabetics?", answer: "Metabolic health is broader than diabetes. Some risk factors can appear before a diagnosis. This page cannot tell you whether you have a condition." },
  { id: "for-me", label: "Is it for me?", answer: "Eligibility is a clinician’s decision based on your health history, needs and preferences. This page cannot diagnose you or decide whether a treatment is suitable." },
];

const hinglishLabels: Record<DoubtId, string> = {
  safe: "Kya yeh safe hai?",
  "muscle-loss": "Kya muscle kam hoga?",
  regain: "Kya weight wapas aa sakta hai?",
  "diabetes-only": "Kya yeh sirf diabetes ke liye hai?",
  "for-me": "Kya yeh mere liye hai?",
};

type LeadNote = {
  score: number | null;
  total: number | null;
  weakestTopic: string | null;
  selectedDoubt: DoubtId | null;
  doubts: DoubtId[];
  streak: number;
  utmSource: string | null;
};

function readLeadNote(): LeadNote {
  let result: GameResult | null = null;
  let doubtsSaved: DoubtId[] = [];
  try {
    const rawResult = window.localStorage.getItem("steerclub:last-result");
    if (rawResult) result = JSON.parse(rawResult) as GameResult;
    const rawDoubts = JSON.parse(window.localStorage.getItem("steerclub:saved-doubts") ?? "[]") as unknown;
    if (Array.isArray(rawDoubts)) doubtsSaved = rawDoubts.filter((id): id is DoubtId => doubts.some((item) => item.id === id));
  } catch { /* a lead can still be sent without optional game history */ }
  const selectedDoubt = selectedDoubtFromStorage();
  const utm = getCapturedUtm();
  return {
    score: result?.score ?? null,
    total: result?.total ?? null,
    weakestTopic: result?.weakestTopic ?? null,
    selectedDoubt,
    doubts: [...new Set([...doubtsSaved, ...(selectedDoubt ? [selectedDoubt] : [])])],
    streak: 0,
    utmSource: utm.utm_source ?? null,
  };
}

export default function CareExperience() {
  const [language, setLanguage] = useState<"en" | "hinglish">("en");
  const [openDoubt, setOpenDoubt] = useState<DoubtId | null>(null);
  const [tappedDoubts, setTappedDoubts] = useState<DoubtId[]>([]);
  const [step, setStep] = useState(1);
  const [firstName, setFirstName] = useState("");
  const [mobile, setMobile] = useState("");
  const [preferredTime, setPreferredTime] = useState("no-preference");
  const [consent, setConsent] = useState(false);
  const [sending, setSending] = useState(false);
  const [complete, setComplete] = useState(false);
  const [message, setMessage] = useState("");
  const [leadNote, setLeadNote] = useState<LeadNote>({ score: null, total: null, weakestTopic: null, selectedDoubt: null, doubts: [], streak: 0, utmSource: null });
  const leadStartedRef = useRef(false);
  const isHinglish = language === "hinglish";

  useEffect(() => {
    captureUtm();
    getSessionId();
    trackEvent("care_opened");
    const note = readLeadNote();
    setLeadNote(note);
    const sessionId = window.localStorage.getItem("steerclub:anonymous-session");
    if (sessionId) {
      void fetch(`/api/session?id=${encodeURIComponent(sessionId)}`, { cache: "no-store" })
        .then((response) => response.ok ? response.json() : null)
        .then((payload) => {
          if (payload && typeof payload.streak === "number") setLeadNote((current) => ({ ...current, streak: payload.streak }));
        })
        .catch(() => undefined);
    }
  }, []);

  const notePreview = useMemo(() => ({ ...leadNote, doubts: [...new Set([...leadNote.doubts, ...tappedDoubts])] }), [leadNote, tappedDoubts]);

  function tapDoubt(id: DoubtId) {
    setOpenDoubt((current) => current === id ? null : id);
    setTappedDoubts((current) => current.includes(id) ? current : [...current, id]);
    trackEvent("doubt_tapped", { doubt: id });
  }

  function startLead() {
    if (leadStartedRef.current) return;
    leadStartedRef.current = true;
    trackEvent("lead_started");
  }

  function continueTo(nextStep: number) {
    if (nextStep === 2 && !firstName.trim()) {
      setMessage("Add your first name to continue.");
      return;
    }
    if (nextStep === 2 && !/^\d{10}$/.test(mobile.replace(/\D/g, ""))) {
      setMessage("Enter a 10-digit Indian mobile number.");
      return;
    }
    setMessage("");
    setStep(nextStep);
  }

  async function submitLead() {
    if (!consent) {
      setMessage("Please read and agree before sending your request.");
      return;
    }
    setSending(true);
    setMessage("");
    try {
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: window.crypto.randomUUID(),
          sessionId: getSessionId(),
          firstName: firstName.trim(),
          mobile: `+91${mobile.replace(/\D/g, "")}`,
          preferredTime,
          language,
          consent,
          note: notePreview,
          utm: getCapturedUtm(),
        }),
      });
      const payload = await response.json() as { error?: string; forwarded?: boolean };
      if (!response.ok) throw new Error(payload.error ?? "Your request could not be saved right now.");
      setComplete(true);
      trackEvent("lead_submitted", { language });
      setMessage(payload.forwarded ? "Your request was sent to the care team." : "Your request was saved. Care-team routing is not connected in this preview.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Your request could not be saved right now.");
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="game-page care-page">
      <header className="game-header"><Link href="/" className="game-wordmark" aria-label="Steer Club home"><BrandMark /></Link><span>care, without the hard sell</span></header>
      <section className="care-intro" aria-labelledby="care-title">
        <div className="care-intro-top"><p className="game-kicker">a conversation, on your terms</p><div className="language-toggle" role="group" aria-label="Choose language"><button type="button" aria-pressed={!isHinglish} onClick={() => setLanguage("en")}>English</button><button type="button" aria-pressed={isHinglish} onClick={() => setLanguage("hinglish")}>Hinglish</button></div></div>
        <h1 id="care-title">{isHinglish ? "Pehle sawaal. Phir aapki choice." : "Questions first. Your choice, always."}</h1>
        <p>{isHinglish ? "Care options samajhne ke liye honest answers. Yeh diagnosis ya medical advice nahi hai." : "Honest answers to help you understand what a conversation could cover. This is not a diagnosis or medical advice."}</p>
      </section>

      <section className="care-doubts" aria-labelledby="care-doubts-title">
        <p className="game-kicker">{isHinglish ? "Jo sawaal aapke mann mein hai" : "the question on your mind"}</p>
        <h2 id="care-doubts-title">{isHinglish ? "Kis baat ko samajhna chahte hain?" : "What’s on your mind?"}</h2>
        <div className="care-doubt-list">
          {doubts.map((item) => (
            <article className={`care-doubt${openDoubt === item.id ? " is-open" : ""}`} key={item.id}>
              <button type="button" aria-expanded={openDoubt === item.id} onClick={() => tapDoubt(item.id)}>
                <span>{isHinglish ? hinglishLabels[item.id] : item.label}</span><span aria-hidden="true">{openDoubt === item.id ? "−" : "+"}</span>
              </button>
              {openDoubt === item.id && <p>{item.answer}</p>}
            </article>
          ))}
        </div>
      </section>

      <section className="care-support" aria-labelledby="support-title">
        <p className="game-kicker">what support can look like</p>
        <h2 id="support-title">A plan shaped around a person.</h2>
        <ul><li>Habit coaching that meets your routines where they are.</li><li>Clinician review of your history, questions and options.</li><li>Clinician-guided therapies, including GLP-1-based treatment where appropriate.</li></ul>
        <p className="care-caveat">No approach is right for everyone. A clinician should explain likely benefits, risks, alternatives and follow-up for your situation. No specific treatment or outcome is promised here.</p>
      </section>

      <section className="care-lead" id="care-form" aria-labelledby="lead-title">
        <p className="game-kicker">a quiet next step</p>
        <h2 id="lead-title">Ask for a conversation.</h2>
        {complete ? (
          <div className="care-confirmation" role="status" aria-live="polite">
            <span className="care-confirm-mark" aria-hidden="true">✓</span>
            <h3>Your note is with us.</h3>
            <p>{message}</p>
            <p>The callback window has not been confirmed for this preview. Please don’t rely on a callback for urgent concerns.</p>
            <Link href="/privacy">Read about your data and deletion options <span aria-hidden="true">→</span></Link>
          </div>
        ) : (
          <>
            <div className="care-steps" aria-label={`Step ${step} of 3`}><span className={step >= 1 ? "is-current" : ""}>your details</span><i /><span className={step >= 2 ? "is-current" : ""}>your preference</span><i /><span className={step >= 3 ? "is-current" : ""}>your note</span></div>
            {step === 1 && <div className="care-form-step">
              <label htmlFor="care-first-name">First name</label><input id="care-first-name" autoComplete="given-name" maxLength={60} value={firstName} onFocus={startLead} onChange={(event) => setFirstName(event.target.value)} />
              <label htmlFor="care-mobile">Mobile number</label><div className="mobile-field"><span>+91</span><input id="care-mobile" inputMode="numeric" autoComplete="tel-national" maxLength={10} value={mobile} onChange={(event) => setMobile(event.target.value.replace(/\D/g, "").slice(0, 10))} aria-describedby="mobile-hint" /></div><small id="mobile-hint">10 digits, for the care team to contact you.</small>
              <button type="button" className="game-challenge-button" onClick={() => continueTo(2)}>Continue <span aria-hidden="true">→</span></button>
            </div>}
            {step === 2 && <div className="care-form-step">
              <label htmlFor="preferred-time">A good time to reach you</label><select id="preferred-time" value={preferredTime} onChange={(event) => setPreferredTime(event.target.value)}><option value="no-preference">No preference</option><option value="morning">Morning</option><option value="afternoon">Afternoon</option><option value="evening">Evening</option></select>
              <p className="care-language-note">Language preference: <strong>{language === "en" ? "English" : "Hinglish"}</strong>. Change it above at any time.</p>
              <div className="care-form-actions"><button type="button" className="text-button" onClick={() => setStep(1)}>Back</button><button type="button" className="game-challenge-button" onClick={() => continueTo(3)}>Review the note <span aria-hidden="true">→</span></button></div>
            </div>}
            {step === 3 && <div className="care-form-step">
              <div className="lead-note-preview"><p className="game-kicker">the note we pass on</p><dl><div><dt>Score</dt><dd>{notePreview.score === null ? "No round completed" : `${notePreview.score}/${notePreview.total}`}</dd></div><div><dt>Weakest topic</dt><dd>{notePreview.weakestTopic ?? "Not available"}</dd></div><div><dt>Doubts tapped</dt><dd>{notePreview.doubts.length ? notePreview.doubts.map((id) => doubts.find((item) => item.id === id)?.label).join(", ") : "None yet"}</dd></div><div><dt>Streak</dt><dd>{notePreview.streak} days</dd></div><div><dt>UTM source</dt><dd>{notePreview.utmSource ?? "Not provided"}</dd></div></dl></div>
              <label className="care-consent"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span>I agree that Steer may use my name and mobile number to contact me about this request. My game note and selected language may be shared with the care team. I can ask for deletion through the privacy page.</span></label>
              <div className="care-form-actions"><button type="button" className="text-button" onClick={() => setStep(2)}>Back</button><button type="button" className="game-challenge-button" disabled={!consent || sending} onClick={() => void submitLead()}>{sending ? "Sending…" : "Send my request"} <span aria-hidden="true">→</span></button></div>
            </div>}
            {message && <p className="care-message" role="status" aria-live="polite">{message}</p>}
            <p className="care-privacy-short">Your contact details are only requested with consent. <Link href="/privacy">See what is stored and how to delete it.</Link></p>
          </>
        )}
      </section>
      <aside className="care-urgent"><strong>Need urgent help?</strong><p>For chest pain, trouble breathing, fainting or another severe or rapidly worsening symptom, seek urgent medical help now. In India, call 112.</p></aside>
      <p className="care-disclaimer">Educational, not medical advice. Talk with a doctor who knows your health history. A game or form cannot determine treatment eligibility or safety.</p>
      <nav className="care-footer" aria-label="Care information"><Link href="/sources">Sources and review</Link><Link href="/privacy">Privacy and deletion</Link><Link href="/">Back to the note</Link></nav>
    </main>
  );
}