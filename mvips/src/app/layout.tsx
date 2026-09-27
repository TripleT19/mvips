import type { Metadata } from "next";
import "./globals.css";

import Header from "./components/Header";
import Footer from "./components/Footer";
import BackToTop from "./components/BackToTop";

export const metadata: Metadata = {
  title: {
    default: "Mount View International Primary School & Early Years Centre",
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
      <body>
        <Header />

        {children}

        <Footer />

        <BackToTop />
      </body>
    </html>
  );
}