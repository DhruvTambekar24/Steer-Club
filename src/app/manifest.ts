import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "The Doctor’s Note | Steer Club",
    short_name: "Steer Club",
    description: "A thoughtful, source-linked note about metabolic health. No health score, no judgement.",
    start_url: "/play",
    display: "standalone",
    background_color: "#F5EBDF",
    theme_color: "#F5EBDF",
    orientation: "portrait",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
