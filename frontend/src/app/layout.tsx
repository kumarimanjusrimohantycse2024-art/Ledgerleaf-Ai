import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LedgerLeaf AI — Less paperwork. Clearer finances. Smarter decisions.",
  description:
    "AI-powered financial operations platform for agencies and service businesses. Manage invoices, track expenses, and make smarter financial decisions with AI-assisted workflows and human approval controls.",
  keywords: "finance, invoices, expenses, AI, accounting, SaaS, agencies",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-cream-50 text-charcoal-800">
        {children}
      </body>
    </html>
  );
}
