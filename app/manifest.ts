import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ProFlow",
    short_name: "ProFlow",
    description: "Gestão de serviços de climatização, elétrica e T.I.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#07111f",
    theme_color: "#0b5fff",
    icons: [
      {
        src: "/proflow-icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/proflow-icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
