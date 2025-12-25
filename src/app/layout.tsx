import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Visual Instrument",
  description: "A simple visual instrument with interactive circles",
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
