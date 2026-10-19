import type { Metadata } from "next";
import GameExperience from "@/components/game/GameExperience";

export const metadata: Metadata = {
  title: "The note, turned over",
  description: "Seven short, source-linked questions. No sign-up and no health score.",
  robots: { index: false, follow: false },
};

export default function PlayPage() {
  return <GameExperience />;
}
