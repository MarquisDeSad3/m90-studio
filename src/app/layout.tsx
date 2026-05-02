import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { SmoothScroll } from "@/components/smooth-scroll";
import { Preloader } from "@/components/preloader";
import "./globals.css";

const familiarPro = localFont({
  src: "../../public/familiar-pro-bold.otf",
  display: "swap",
  weight: "700",
  style: "normal",
  variable: "--font-familiar-pro",
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://m90-studio.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "M90 Studio — Fundas custom para tu móvil en Cuba",
    template: "%s · M90 Studio",
  },
  description:
    "Diseña la funda de tu teléfono con tus fotos. Mosaicos de 1 a 9 fotos, modelos iPhone, Samsung, Xiaomi y más. Pedido por WhatsApp, envío a toda Cuba.",
  applicationName: "M90 Studio",
  keywords: [
    "fundas móvil Cuba",
    "fundas personalizadas",
    "carcasas custom Cuba",
    "fundas iPhone Cuba",
    "fundas Samsung Cuba",
    "M90 Studio",
  ],
  icons: {
    icon: "/brand/m90-navy.png",
  },
  alternates: { canonical: "/" },
  openGraph: {
    title: "M90 Studio — Fundas custom para móvil",
    description:
      "Diseña la funda de tu teléfono desde el móvil. Tus fotos, tu mosaico, tu funda. Cuba.",
    type: "website",
    locale: "es_CU",
    siteName: "M90 Studio",
    url: SITE_URL,
    images: [{ url: "/brand/m90-navy.png", alt: "M90 Studio" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#f7ebc8",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      className={`${familiarPro.variable} ${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>
        <Preloader />
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}
