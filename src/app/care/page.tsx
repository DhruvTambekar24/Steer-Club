import type { Metadata } from "next";
import CareExperience from "@/components/care/CareExperience";

export const metadata: Metadata = {
  title: "Explore your care options",
  description: "Explore questions to ask a clinician and request a conversation with Steer.",
};

export default function CarePage() {
  return <CareExperience />;
}