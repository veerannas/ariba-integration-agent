import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AribaFlow — SAP Ariba Integration Portal",
  description:
    "WebMCP-powered procurement portal. AI agents and integration teams onboard suppliers 10× faster with 6 structured WebMCP tools for cXML validation, scenario generation, EDI mapping, and integration guide creation.",
  keywords: ["SAP Ariba", "WebMCP", "cXML", "EDI", "supplier onboarding", "procurement automation"],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full overflow-hidden">{children}</body>
    </html>
  );
}
