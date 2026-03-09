import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Highstreet AI — Autonomous AI Workforce for SMBs",
  description:
    "Autonomous AI workforce for small businesses. Operations, HR, AI adoption, market intelligence. Powered by Z.AI GLM. Built for bakeries, coffee shops, clinics and every business on the high street.",
  keywords: [
    "AI",
    "small business",
    "SMB",
    "workforce",
    "operations",
    "HR",
    "market intelligence",
    "AI adoption",
    "Z.AI",
    "GLM",
  ],
  authors: [{ name: "Highstreet AI" }],
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    title: "Highstreet AI — Autonomous AI Workforce for SMBs",
    description:
      "Autonomous AI workforce for small businesses. Operations, HR, AI adoption, market intelligence. Powered by Z.AI GLM.",
    type: "website",
    siteName: "Highstreet AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "Highstreet AI — Autonomous AI Workforce for SMBs",
    description:
      "Autonomous AI workforce for small businesses. Operations, HR, AI adoption, market intelligence. Powered by Z.AI GLM.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0f0f" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("theme");if(t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme:dark)").matches))document.documentElement.classList.add("dark")}catch(e){}})()`,
          }}
        />
      </head>
      <body className="font-sans antialiased bg-white dark:bg-[#0f0f0f] text-[#1a1a1a] dark:text-[#e8e8e8] flex flex-col h-screen">
        <Header />
        <div className="flex-1 overflow-hidden flex flex-col">
          {children}
        </div>
        <Footer />
      </body>
    </html>
  );
}
