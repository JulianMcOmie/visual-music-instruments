import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cabin Instruments",
  description: "Create your own visual instruments with AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
