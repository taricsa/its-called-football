import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "It's Called Football. Period.",
  description:
    "The official etymological database and enforcement terminal correcting regional naming violations.",
  openGraph: {
    title: "It's Called Football.",
    description: "The planet has reached a consensus. Stop calling it soccer.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "It's Called Football.",
    description: "The rest of the world is waiting for you to catch up.",
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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
