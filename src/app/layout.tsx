import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Spun — AI Marketing Automation for Founders",
  description: "Automate your entire marketing function with AI-powered campaign planning, prospect tiering, and ROI tracking.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
