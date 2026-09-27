import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default:
      "Mount View International Primary School & Early Years Centre",
    template: "%s | Mount View International Primary School",
  },
  description:
    "Mount View International Primary School & Early Years Centre – Fostering growth, excellence and empathy.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}