import type { Metadata } from "next";
import { Geist, Geist_Mono, JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const fontSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans-next",
});

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono-next",
});

export const metadata: Metadata = {
  title: "TeamDoQ",
  description: "Team knowledge base for PDFs — upload, vectorize, and ask questions with source-backed answers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fontSans.variable} ${fontMono.variable}`}>
        {/* The 'font-sans' class tells Tailwind to use this as the default.
          'antialiased' makes the text render much sharper on macOS/iOS.
        */}
      <body
        className={` antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
