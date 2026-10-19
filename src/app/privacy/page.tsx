import type { Metadata } from "next";
import PrivacyExperience from "@/components/care/PrivacyExperience";

export const metadata: Metadata = {
  title: "Privacy and deletion",
  description: "What Steer Club stores in this anonymous learning preview and how to request deletion.",
};

export default function PrivacyPage() {
  return <PrivacyExperience />;
}