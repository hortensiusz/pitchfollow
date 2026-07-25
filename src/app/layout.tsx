import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PitchFollow — Sales Follow-up PPT Generator",
  description: "Meeting notes to follow-up PPTX in one click. Chambers internal tool.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
