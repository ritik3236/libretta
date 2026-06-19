import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";
import { appConfig, appTitle } from "@/lib/app-config";
import { DEV_AUTH_BYPASS } from "@/lib/dev-auth";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: appTitle,
  description: appConfig.description,
  icons: { icon: "/icons/icon.svg", apple: "/icons/icon.svg" },
  appleWebApp: { capable: true, title: appConfig.name, statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: appConfig.backgroundColor,
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tree = (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );

  // Skip ClerkProvider entirely when the dev bypass is on — the Clerk client SDK
  // is what triggers the *.accounts.dev handshake the localhost preview can't follow.
  return DEV_AUTH_BYPASS ? tree : <ClerkProvider>{tree}</ClerkProvider>;
}
