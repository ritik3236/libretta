import type { MetadataRoute } from "next";
import { appConfig, appTitle } from "@/lib/app-config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: appTitle,
    short_name: appConfig.name,
    description: appConfig.description,
    start_url: appConfig.appStartUrl,
    display: "standalone",
    background_color: appConfig.backgroundColor,
    theme_color: appConfig.themeColor,
    icons: [
      { src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
