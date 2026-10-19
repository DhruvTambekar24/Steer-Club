"use client";

import { useState } from "react";
import { mythCards } from "@/content/myths";

interface MythWallProps {
  locked: boolean;
}

export default function MythWall({ locked }: MythWallProps) {
  const [openCard, setOpenCard] = useState<string | null>(null);

  return (
    <section className="myth-section section-pad" aria-labelledby="myth-wall-title">
      <p className="section-kicker"><span className="kicker-rule" /> a few notes from the myth wall</p>
      <h2 className="section-heading" id="myth-wall-title">Small myths. <em>Better questions.</em></h2>
      <p className="section-copy">Swipe the paper strip. Tap a note to turn it over and see the evidence-led answer.</p>
      <div className="myth-strip" aria-label="Ten myth cards; scroll horizontally">
        {mythCards.map((card, index) => {
          const isOpen = openCard === card.id;
          return (
            <article className={`myth-card${isOpen ? " is-open" : ""}`} key={card.id}>
              <button
                className="myth-flip"
                type="button"
                aria-pressed={isOpen}
                aria-label={isOpen ? `Show the myth: ${card.claim}` : `Read the answer to: ${card.claim}`}
                onClick={() => setOpenCard(isOpen ? null : card.id)}
              >
                <span className="myth-card-inner">
                  <span className="myth-face front">
                    <span className="myth-label"><span className="myth-number">{String(index + 1).padStart(2, "0")}</span> A thought to turn over</span>
                    <span className="myth-claim">“{card.claim}”</span>
                    <span className="myth-flip-hint"><span>Tap to see the note</span><span aria-hidden="true">↗</span></span>
                  </span>
                  <span className="myth-face back">
                    <span className="myth-label"><span className="myth-number">{card.verdict.toLowerCase()}</span> The note</span>
                    <span className="myth-fact">{card.cardCopy}</span>
                    <span className="myth-flip-hint"><span>Tap to turn it back</span><span aria-hidden="true">↶</span></span>
                  </span>
                </span>
              </button>
              {isOpen && (
                <div className="myth-source-links" aria-label="Sources for this note">
                  {card.sources.map((source) => (
                    <a key={source.url} href={source.url} target="_blank" rel="noreferrer" title={source.supports}>
                      {source.title}
                    </a>
                  ))}
                </div>
              )}
            </article>
          );
        })}
      </div>
      <p className="myth-wall-note">No score here. Just a few ideas worth checking.</p>
      <a className="myth-cta" href={locked ? "#doubt" : "#hero"}>
        {locked ? "Choose a question for your round" : "Make your first guess"}
        <span aria-hidden="true">→</span>
      </a>
    </section>
  );
}
