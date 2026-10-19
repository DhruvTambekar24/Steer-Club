import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "A shared seven-note Steer Club challenge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type Props = { params: Promise<{ id: string }> };

export default async function ChallengeImage({ params }: Props) {
  await params;
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "58px 74px", backgroundColor: "#F5EBDF", color: "#351D1D" }}>
      <div style={{ display: "flex", justifyContent: "space-between", color: "#C04E2A", fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 27 }}>
        <span>steer club</span><span style={{ color: "#80675E", fontFamily: "Arial, sans-serif", fontStyle: "normal", fontSize: 18 }}>a note passed between friends</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", maxWidth: 900 }}>
        <span style={{ color: "#9A5948", fontFamily: "Arial, sans-serif", fontSize: 20, letterSpacing: 2 }}>SEVEN SHARED QUESTIONS</span>
        <span style={{ marginTop: 20, color: "#661414", fontFamily: "Georgia, serif", fontSize: 94, lineHeight: 1.05 }}>Can you beat it?</span>
        <span style={{ marginTop: 22, color: "#523331", fontFamily: "Arial, sans-serif", fontSize: 26 }}>Same order. Two notes for your doubt. No health score.</span>
      </div>
      <div style={{ width: 95, height: 5, backgroundColor: "#C04E2A" }} />
    </div>,
    { ...size },
  );
}
