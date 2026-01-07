import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Modular Symmetry",
  description: "A kaleidoscopic visual instrument with geometric patterns",
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
