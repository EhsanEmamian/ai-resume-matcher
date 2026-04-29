import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "AI Resume Matcher",
    template: "AI Resume Matcher | %s",
  },
  description: "Resume parsing, live job search, and explainable matching",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#08101c] text-white antialiased">
        {children}
      </body>
    </html>
  );
}