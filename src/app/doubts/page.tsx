import type { Metadata } from "next";
import DoubtsTracker from "@/components/game/DoubtsTracker";

export const metadata: Metadata = {
  title: "Your margin notes",
  description: "The doubts you chose and health myths you decided to keep asking about.",
  robots: { index: false, follow: false },
};

export default function DoubtsPage() {
  return <DoubtsTracker />;
}
