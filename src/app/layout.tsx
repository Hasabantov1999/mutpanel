import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Duralux - Authentication",
  description: "Modern authentication system with Next.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
