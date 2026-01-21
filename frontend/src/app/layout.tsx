import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "SwarmShield | Trade Together. Defeat MEV.",
  description: "Join the swarm. Your trades are batched with others, making you invisible to MEV bots. Built for Solana.",
  keywords: ["Solana", "MEV Protection", "Privacy", "Dark Pool", "DeFi", "Swarm Intelligence"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-black text-white antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
