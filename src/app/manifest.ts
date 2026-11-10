import type { MetadataRoute } from "next";

/** Lets shoppers add Trend Street to their home screen and open it like an app (full screen, own icon). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Trend Street — The Style Hub",
    short_name: "Trend Street",
    description: "Oversized tees, jeans, boxy fits and jackets. New drops, cash on delivery, easy exchanges.",
    start_url: "/?source=homescreen",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F5F5F5",
    theme_color: "#0A0A0A",
    categories: ["shopping", "lifestyle"],
    lang: "en-IN",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "New in", url: "/shop?sort=newest&source=homescreen", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "My bag", url: "/bag?source=homescreen", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Track order", url: "/track?source=homescreen", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
