import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PublicResultStory from "@/components/game/PublicResultStory";
import { getPublicResult } from "@/lib/public-results";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const bundle = await getPublicResult(id);
    if (!bundle) return { title: "A note from Steer Club", robots: { index: false, follow: false } };
    const title = `${bundle.result.score} of ${bundle.result.total} — a Steer Club note`;
    const description = "A short, source-linked note about metabolic health. No health score, no judgement.";
    return {
      title,
      description,
      robots: { index: false, follow: false },
      openGraph: {
        type: "website",
        title,
        description,
        images: [{ url: `/r/${encodeURIComponent(id)}/opengraph-image`, width: 1200, height: 630, alt: title }],
      },
      twitter: { card: "summary_large_image", title, description, images: [`/r/${encodeURIComponent(id)}/opengraph-image`] },
    };
  } catch {
    return { title: "A note from Steer Club", robots: { index: false, follow: false } };
  }
}

export default async function PublicResultPage({ params }: Props) {
  const { id } = await params;
  try {
    const bundle = await getPublicResult(id);
    if (!bundle) notFound();
    return <PublicResultStory bundle={bundle} />;
  } catch {
    notFound();
  }
}
