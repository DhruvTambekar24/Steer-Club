import type { Metadata, Viewport } from "next";
import "@fontsource-variable/fraunces/index.css";
import "@fontsource-variable/dm-sans/index.css";
import "./globals.css";
import "./landing-extras.css";
import "./game.css";
import "./phase-c.css";
import "./care.css";

export const metadata: Metadata = {
  title: {
    default: "The Doctor’s Note | Steer Club",
    template: "%s | Steer Club",
  },
  description:
    "A two-minute, no-sign-up note on the parts of metabolic health that feel in your control — and the doubts worth asking about.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
  keywords: ["metabolic health", "India", "health education", "doctor's note"],
  openGraph: {
    type: "website",
    siteName: "Steer Club",
    title: "The Doctor’s Note | Steer Club",
    description:
      "A thoughtful, no-sign-up way to learn about metabolic health and ask the questions on your mind.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F5EBDF",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
