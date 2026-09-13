import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Neuronexus - Next-Gen Intelligence | Lead CRM",
  description: "Production-ready Lead Management CRM for Neuronexus Next-Gen Intelligence.",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon.png", type: "image/png" },
      { url: "/icon.png", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 antialiased selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
