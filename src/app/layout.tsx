import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MUT Panel",
  description: "MUT Yönetim Paneli",
  icons: {
    icon: "/favicon.png",
  },
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
