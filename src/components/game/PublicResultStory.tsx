"use client";

import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import WrappedStory from "@/components/game/WrappedStory";
import type { PublicResultBundle } from "@/lib/public-results";

export default function PublicResultStory({ bundle }: { bundle: PublicResultBundle }) {
  return (
    <main className="game-page">
      <header className="game-header">
        <Link href="/" className="game-wordmark" aria-label="Steer Club home"><BrandMark /></Link>
        <span>a note someone chose to share</span>
      </header>
      <WrappedStory
        result={bundle.result}
        questions={bundle.questions}
        shareable
        onBackAction={() => window.location.assign("/play")}
      />
      <p className="game-disclaimer">This public note contains a learning result, not a health profile. Educational only—not medical advice.</p>
    </main>
  );
}
