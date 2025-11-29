import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Clarithm - Data Insights",
  description: "Transform your data into insights",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
