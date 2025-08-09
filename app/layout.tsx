import type { Metadata } from "next";
import "./globals.css";

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "꽤 잘맞는 AI 사주 분석",
  description: "냥냥체 인젝션 켜면 쉽게 설명해준다냥",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-gradient-to-br from-pink-500 via-rose-900 via-purple-800 via-amber-700 to-yellow-600 animate-gradient text-white">
        {children}
      </body>
    </html>
  );
}
