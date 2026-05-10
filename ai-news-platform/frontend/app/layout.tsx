import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { AuthProvider } from "@/components/providers/auth-provider";
import { getSiteUrl } from "@/lib/site-config";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "AI Signal — AI news, articles, tutorials, trends",
    template: "%s · AI Signal",
  },
  description:
    "A Next.js frontend for AI news, long-form articles, tutorials, and trend analysis — ready to connect to your API.",
  openGraph: {
    type: "website",
    siteName: "AI Signal",
    locale: "en_US",
    title: "AI Signal — AI news, articles, tutorials, trends",
    description:
      "A Next.js frontend for AI news, long-form articles, tutorials, and trend analysis — ready to connect to your API.",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Signal — AI news, articles, tutorials, trends",
    description:
      "A Next.js frontend for AI news, long-form articles, tutorials, and trend analysis — ready to connect to your API.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <AuthProvider>
          <SiteHeader />
          <div className="flex-1">{children}</div>
          <SiteFooter />
        </AuthProvider>
      </body>
    </html>
  );
}
