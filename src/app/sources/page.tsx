import type { Metadata } from "next";
import Link from "next/link";
import { mythCards } from "@/content/myths";
import { questionBank } from "@/lib/server-questions";
import BrandMark from "@/components/BrandMark";

export const metadata: Metadata = {
  title: "Sources and review",
  description: "Source links for Steer Club’s educational notes, with a clear review-status statement.",
};

export default function SourcesPage() {
  const sources = new Map<string, { title: string; url: string; supports: string }>();
  mythCards.forEach((card) => card.sources.forEach((source) => sources.set(source.url, source)));
  questionBank.forEach((question) => question.sources.forEach((source) => sources.set(source.url, source)));

  return (
    <main className="game-page care-page sources-page">
      <header className="game-header"><Link href="/" className="game-wordmark" aria-label="Steer Club home"><BrandMark /></Link><span>the evidence behind the notes</span></header>
      <section className="care-intro"><p className="game-kicker">sources and review</p><h1>Claims need somewhere to stand.</h1><p>These links support the short educational notes in this experience. A source can support only the claim and limits described beside it.</p></section>
      <p className="sources-review-note"><strong>Review status:</strong> no clinician reviewer or review date was supplied for this preview. This is educational, not medical advice, and it does not diagnose or recommend treatment.</p>
      <ul className="sources-directory">{Array.from(sources.values()).map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.title} <span aria-hidden="true">↗</span></a><p>{source.supports}</p></li>)}</ul>
      <p className="care-disclaimer">For chest pain, trouble breathing, fainting or another severe or rapidly worsening symptom, seek urgent medical help now. In India, call 112.</p>
      <nav className="care-footer" aria-label="Care information"><Link href="/care">Care options</Link><Link href="/privacy">Privacy and deletion</Link><Link href="/">Back to the note</Link></nav>
    </main>
  );
}