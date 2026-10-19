"use client";

import { FormEvent, useState } from "react";
import BrandMark from "@/components/BrandMark";

type Funnel = { event: string; label: string; sessions: number; dropOff: number };
type Dashboard = { since: string; sampledEvents: number; capped: boolean; funnel: Funnel[]; engagement: Omit<Funnel, "dropOff">[]; sources: { source: string; sessions: number }[] };

export default function AdminExperience() {
  const [password, setPassword] = useState("");
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadDashboard(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin", { headers: { Authorization: `Bearer ${password}` }, cache: "no-store" });
      const payload = await response.json() as Dashboard & { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "The dashboard could not be loaded.");
      setDashboard(payload);
    } catch (error) {
      setDashboard(null);
      setMessage(error instanceof Error ? error.message : "The dashboard could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="game-page care-page admin-page">
      <header className="game-header"><a href="/" className="game-wordmark" aria-label="Steer Club home"><BrandMark /></a><span>private funnel view</span></header>
      <section className="care-intro"><p className="game-kicker">admin · last 30 days</p><h1>Where the note travels.</h1><p>Aggregated anonymous event counts only. This view never displays names, mobile numbers or free-text care notes.</p></section>
      <form className="admin-login" onSubmit={(event) => void loadDashboard(event)}>
        <label htmlFor="admin-password">Admin password</label><input id="admin-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        <button type="submit" className="game-challenge-button" disabled={loading}>{loading ? "Opening…" : "Open funnel"} <span aria-hidden="true">→</span></button>
      </form>
      {message && <p role="status" aria-live="polite" className="care-message">{message}</p>}
      {dashboard && <section className="admin-dashboard" aria-labelledby="funnel-title">
        <div className="admin-summary"><strong>{dashboard.sampledEvents.toLocaleString()}</strong><span>events in the last 30 days</span></div>
        {dashboard.capped && <p className="admin-cap-note">This view reached the 20,000-event sample cap.</p>}
        <h2 id="funnel-title">Anonymous funnel</h2>
        <div className="admin-funnel">{dashboard.funnel.map((step) => <div className="admin-funnel-row" key={step.event}><span>{step.label}</span><strong>{step.sessions.toLocaleString()}</strong><small>{step.dropOff ? `${step.dropOff.toLocaleString()} fewer than previous` : "start"}</small></div>)}</div>
        <h2>Engagement</h2>
        <div className="admin-funnel">{dashboard.engagement.map((step) => <div className="admin-funnel-row" key={step.event}><span>{step.label}</span><strong>{step.sessions.toLocaleString()}</strong><small>distinct anonymous sessions</small></div>)}</div>
        <h2>UTM source</h2>
        {dashboard.sources.length ? <ul className="admin-sources">{dashboard.sources.map((source) => <li key={source.source}><span>{source.source}</span><strong>{source.sessions.toLocaleString()}</strong></li>)}</ul> : <p>No source labels in this window.</p>}
        <p className="admin-data-note">Counts are distinct anonymous sessions per event, and event totals may exceed sessions. No lead contact data is queried.</p>
      </section>}
      <p className="care-disclaimer">Protect this route with a strong secret `ADMIN_PASSWORD` and HTTPS. Rotate the password if it is exposed.</p>
    </main>
  );
}