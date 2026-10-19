"use client";

import Link from "next/link";
import { useState } from "react";
import { getSessionId } from "@/lib/game";
import BrandMark from "@/components/BrandMark";

export default function PrivacyExperience() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function deleteRecord() {
    if (!window.confirm("Delete this browser’s Steer Club server record, including results, tracker notes, challenges, check-ins, events and care requests? This cannot be undone.")) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/privacy", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: getSessionId() }),
      });
      const payload = await response.json() as { deleted?: boolean; error?: string };
      if (!response.ok || !payload.deleted) throw new Error(payload.error ?? "The record could not be deleted.");
      for (const key of Object.keys(window.localStorage)) {
        if (key.startsWith("steerclub:")) window.localStorage.removeItem(key);
      }
      document.cookie = "sc_session=; Max-Age=0; Path=/; SameSite=Lax";
      setMessage("Your Steer Club server record and this browser’s saved Steer Club data have been deleted.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The record could not be deleted right now.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="game-page care-page privacy-page">
      <header className="game-header"><Link href="/" className="game-wordmark" aria-label="Steer Club home"><BrandMark /></Link><span>your data, plainly explained</span></header>
      <section className="care-intro"><p className="game-kicker">privacy note</p><h1>What we keep, and how to clear it.</h1><p>This preview uses a random browser ID, not an account. It does not ask for your name or phone unless you choose to send a care request.</p></section>
      <section className="privacy-copy"><h2>Game and challenge data</h2><p>When online, the anonymous session can store your guess, selected doubts, answer records, score, topic summary, streak, challenge order and habit check-ins. UTM campaign labels may be attached. Browser-only data can be cleared in your browser settings; that alone does not delete server records.</p><h2>Care requests</h2><p>If you submit the optional form with consent, your first name, Indian mobile number, preferred contact time, language and the previewed note are stored on the protected server. The request is sent to an external care system only when a server-side webhook is configured. Any external copy must also be deleted through that system; this preview has no external deletion connection.</p><h2>Analytics</h2><p>Events use the anonymous session ID and an allowlist of small interaction details. The event endpoint rejects unknown properties and does not accept names, phone numbers or free-text notes.</p><h2>Retention</h2><p>This preview has no automatic retention cutoff configured. Use the deletion control below to remove the anonymous server record and its linked Steer Club data. The operating team still needs to set an approved retention schedule before production.</p><h2>Clinical review</h2><p>This experience is educational, not medical advice. No clinician review is claimed here. Read the <Link href="/sources">sources and review note</Link>.</p></section>
      <section className="privacy-delete"><h2>Delete this browser’s Steer Club record</h2><p>This removes the linked anonymous session, game results, challenge records, tracker data, event rows and care requests from the Steer Club database. A friend’s challenge can also disappear if it was created from this session.</p><button type="button" className="game-challenge-button" disabled={busy} onClick={() => void deleteRecord()}>{busy ? "Deleting…" : "Delete my server record"}</button><p role="status" aria-live="polite">{message}</p></section>
      <p className="care-disclaimer">For chest pain, trouble breathing, fainting or another severe or rapidly worsening symptom, seek urgent medical help now. In India, call 112.</p>
      <nav className="care-footer" aria-label="Care information"><Link href="/care">Care options</Link><Link href="/sources">Sources and review</Link><Link href="/">Back to the note</Link></nav>
    </main>
  );
}