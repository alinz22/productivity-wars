import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Productivity Wars",
  description: "Gamified productivity tracker — compete with your friends",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
