import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Landing Zone - Professional Marketplace",
  description: "Connect Discord communities with professional marketplace functionality",
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


