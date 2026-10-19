import type { Metadata } from "next";
import AdminExperience from "@/components/care/AdminExperience";

export const metadata: Metadata = {
  title: "Admin funnel",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminExperience />;
}