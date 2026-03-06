import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Highstreet AI — Autonomous AI Workforce for SMBs",
  description:
    "Multi-agent AI platform powered by Z.AI GLM-4-Plus. Built for bakeries, coffee shops, clinics and every business on the high street. Get instant operations, HR, adoption, and market intelligence recommendations.",
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
    "GLM-4-Plus",
  ],
  authors: [{ name: "Highstreet AI" }],
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "Highstreet AI — Autonomous AI Workforce for SMBs",
    description:
      "Multi-agent AI platform powered by Z.AI GLM-4-Plus. Get instant business recommendations.",
    type: "website",
    siteName: "Highstreet AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "Highstreet AI — Autonomous AI Workforce for SMBs",
    description:
      "Multi-agent AI platform powered by Z.AI GLM-4-Plus. Get instant business recommendations.",
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
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("theme");if(t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme:dark)").matches))document.documentElement.classList.add("dark")}catch(e){}})()`,
          }}
        />
      </head>
      <body className="font-sans antialiased min-h-screen bg-white dark:bg-[#0f0f0f] text-[#1a1a1a] dark:text-[#e8e8e8]">
        {children}
      </body>
    </html>
  );
}
