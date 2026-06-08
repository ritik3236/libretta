/**
 * Single source of truth for brand / app-wide constants.
 * Change the name, tagline, colours, etc. here — every screen, the page
 * title, the PWA manifest, and export filenames read from this.
 */
export const appConfig = {
  name: "Libretta",
  tagline: "Digital Khata",
  description:
    "Track money you give and get. Per-customer running balances, multi-currency, CSV & PDF export.",
  themeColor: "#16a34a",
  backgroundColor: "#ffffff",
  /** prefix for downloaded files, e.g. libretta-export.csv */
  fileSlug: "libretta",
  /** default landing after sign-in */
  appStartUrl: "/dashboard",
} as const;

export const appTitle = `${appConfig.name} — ${appConfig.tagline}`;
