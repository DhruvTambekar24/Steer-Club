import { ImageResponse } from "next/og";
import { getPublicResult } from "@/lib/public-results";

export const runtime = "nodejs";
export const alt = "A Steer Club doctor’s note: a small health-learning result, not a health score";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function OpenGraphImage({ params }: Props) {
  const { id } = await params;
  let score: number | null = null;
  let total: number | null = null;
  try {
    const bundle = await getPublicResult(id);
    if (bundle) {
      score = bundle.result.score;
      total = bundle.result.total;
    }
  } catch { /* use the neutral cover if the optional social card cannot load */ }

  return new ImageResponse(
    <div style={{
      width: "100%", height: "100%", display: "flex", flexDirection: "column",
      justifyContent: "space-between", padding: "56px 74px", color: "#F5EBDF",
      backgroundColor: "#661414", fontFamily: "Georgia, serif",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#E6CBBD", fontSize: 24, fontStyle: "italic" }}>
        <span>steer club</span><span style={{ fontFamily: "Arial, sans-serif", fontStyle: "normal", fontSize: 17 }}>a note to keep · educational, not medical advice</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", maxWidth: 970 }}>
        <span style={{ color: "#E6CBBD", fontFamily: "Arial, sans-serif", fontSize: 21, letterSpacing: 2 }}>YOUR NOTE FROM TODAY</span>
        <div style={{ display: "flex", alignItems: "baseline", gap: 23, marginTop: 17 }}>
          <span style={{ color: "#F5EBDF", fontSize: 112, lineHeight: 1 }}>{score === null ? "A note" : `${score}/${total}`}</span>
          <span style={{ color: "#E6CBBD", fontSize: 47, fontStyle: "italic" }}>{score === null ? "turned over." : "small questions. no health score."}</span>
        </div>
        <p style={{ margin: "26px 0 0", color: "#F5EBDF", fontFamily: "Arial, sans-serif", fontSize: 25, lineHeight: 1.4 }}>
          A source-linked moment of learning about metabolic health. No judgement attached.
        </p>
      </div>
      <div style={{ width: 90, height: 5, backgroundColor: "#C04E2A" }} />
    </div>,
    { ...size },
  );
}
