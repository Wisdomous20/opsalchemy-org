import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";

const bodyFont = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const displayFont = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://opsalchemy.org"),
  title: {
    default: "OPSAlchemy | Real Estate Operations, By Design",
    template: "%s | OPSAlchemy",
  },
  description:
    "OPSAlchemy helps real estate businesses transform operational friction into clear systems, stronger client experiences, and sustainable growth.",
  applicationName: "OPSAlchemy",
  keywords: [
    "real estate operations",
    "transaction management",
    "listing coordination",
    "operations consulting",
    "real estate systems",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "OPSAlchemy",
    title: "OPSAlchemy | Real Estate Operations, By Design",
    description:
      "Transform operational friction into clear systems, stronger client experiences, and sustainable growth.",
  },
  twitter: {
    card: "summary_large_image",
    title: "OPSAlchemy | Real Estate Operations, By Design",
    description:
      "Transform operational friction into clear systems, stronger client experiences, and sustainable growth.",
  },
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: "#171713",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${bodyFont.variable} ${displayFont.variable}`}>
      <body>{children}</body>
    </html>
  );
}
