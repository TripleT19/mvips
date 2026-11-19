// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SITE, absoluteUrl, socialProfiles } from "@/lib/seo";
import JsonLd from "@/app/components/JsonLd";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),

  title: {
    default: "Mount View International Primary School & Early Years Centre",
    template: "%s | Mount View International Primary School",
  },
  description: SITE.description,

  applicationName: SITE.shortName,
  authors: [{ name: SITE.name, url: SITE.url }],
  creator: SITE.name,
  publisher: SITE.name,
  category: "education",

  alternates: {
    canonical: "/",
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  openGraph: {
    type: "website",
    siteName: SITE.name,
    locale: SITE.locale,
    url: SITE.url,
    title: "Mount View International Primary School & Early Years Centre",
    description:
      "A Cambridge curriculum international school in Blantyre, Malawi — from Early Years to Year 6. Fostering growth, excellence and empathy.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mount View International Primary School & Early Years Centre",
    description:
      "A Cambridge curriculum international school in Blantyre, Malawi — from Early Years to Year 6.",
    site: SITE.twitterHandle,
  },

  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },

  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
};

export const viewport: Viewport = {
  themeColor: "#252B68",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body suppressHydrationWarning>
        {/* Global School + EducationalOrganization structured data */}
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": ["School", "EducationalOrganization"],
            "@id": `${SITE.url}/#school`,
            name: SITE.name,
            alternateName: [
              "Mount View International Primary School",
              "Mount View Primary School",
              "Mount View Early Years Centre",
              "Mount View International School Blantyre",
            ],
            legalName: SITE.legalName,
            description: SITE.description,
            url: SITE.url,
            logo: absoluteUrl(SITE.logo),
            image: absoluteUrl(SITE.ogImage),
            telephone: SITE.phone,
            email: SITE.email,
            foundingDate: String(SITE.foundingYear),

            // 🔑 ALL SIX SOCIALS in sameAs — tells Google these are our official profiles
            sameAs: socialProfiles,

            address: {
              "@type": "PostalAddress",
              addressLocality: SITE.address.locality,
              addressRegion: SITE.address.region,
              addressCountry: SITE.address.country,
            },
            geo: {
              "@type": "GeoCoordinates",
              latitude: SITE.geo.latitude,
              longitude: SITE.geo.longitude,
            },
            areaServed: [
              { "@type": "City", name: "Blantyre" },
              { "@type": "Country", name: "Malawi" },
            ],
            knowsAbout: [
              "Cambridge Primary",
              "Cambridge Early Years",
              "International education",
              "Primary school education",
              "Early Years education",
              "Preschool education",
              "Blantyre schools",
            ],
          }}
        />

        {children}
      </body>
    </html>
  );
}