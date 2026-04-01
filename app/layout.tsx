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
  title: "Nexus AI",
  description: "AI-powered document search for your team",
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
