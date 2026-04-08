import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/app/globals.css";
import SessionWrapper from "@/components/SessionWrapper";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "Storely | Panel de administración",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SessionWrapper>
      <html lang="en" suppressHydrationWarning>
        <head>
          <link rel="icon" href="/favicon.ico" sizes="any" />
          <link
            rel="icon"
            href="/icon.ico"
            type="image/ico"
            sizes="all"
          />
          <link
            rel="apple-touch-icon"
            href="/apple-icon.png"
            type="image/png"
            sizes="all"
          />
        </head>
        <body className={inter.className} suppressHydrationWarning>{children}</body>
      </html>
    </SessionWrapper>
  );
}
