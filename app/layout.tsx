import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Neuronexus - Next-Gen Intelligence | Lead CRM",
  description: "Production-ready Lead Management CRM for Neuronexus Next-Gen Intelligence.",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
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
