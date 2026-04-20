import type { Metadata } from "next";
import {
  Cormorant_Garamond,
  DM_Sans,
  Great_Vibes,
} from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  weight: ["400", "500", "600", "700"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["400", "500", "600", "700"],
});

const greatVibes = Great_Vibes({
  subsets: ["latin"],
  variable: "--font-great-vibes",
  weight: "400",
});

export const metadata: Metadata = {
  title: "Uju & Chinedu — #TheCUStory'26",
  description:
    "Wedding celebration of Uju & Chinedu — May 16, 2026 · Ikorodu, Lagos State, Nigeria.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${cormorant.variable} ${dmSans.variable} ${greatVibes.variable} antialiased bg-page text-foreground`}
      >
        {children}
      </body>
    </html>
  );
}
