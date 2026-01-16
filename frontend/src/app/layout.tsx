import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "SwarmShield | Dark Liquidity Pool for AI Agents",
  description: "MEV Protection via ZK Compression on Solana. Protect your AI agent swarm from sandwich attacks.",
  keywords: ["Solana", "Privacy", "MEV", "AI Agents", "Dark Pool", "ZK Compression"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-void text-matrix antialiased">
        <div className="fixed inset-0 grid-bg pointer-events-none" />
        <div className="relative z-10">
          <Providers>{children}</Providers>
        </div>
      </body>
    </html>
  );
}
