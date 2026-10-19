import type { Metadata } from "next";
import ChallengeExperience from "@/components/game/ChallengeExperience";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: "A friend’s seven-note challenge",
    description: "A source-linked, same-order learning round. No leaderboard, no health score.",
    robots: { index: false, follow: false },
    openGraph: {
      type: "website",
      title: "Can you beat this Steer Club note?",
      description: "Seven shared questions. No health score, no judgement.",
      images: [{ url: `/c/${encodeURIComponent(id)}/opengraph-image`, width: 1200, height: 630, alt: "A shared seven-note Steer Club challenge" }],
    },
  };
}

export default async function ChallengePage({ params }: Props) {
  const { id } = await params;
  return <ChallengeExperience id={id} />;
}
