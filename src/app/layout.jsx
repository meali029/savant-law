import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../components/ThemeProvider";
import {LanguageProvider} from "../context/LanguageContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Savant Law - AI-Powered Legal Document Management",
  description: "Streamline your legal document creation, editing, and management with AI-powered tools. Create, edit, and organize legal documents efficiently.",
  keywords: "legal documents, AI, document management, law, templates, contracts",
  authors: [{ name: "Savant Law" }],
  viewport: "width=device-width, initial-scale=1",
  robots: "index, follow",
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-48x48.png', sizes: '48x48', type: 'image/png' },
    ],
    shortcut: '/favicon-16x16.png',
    apple: '/favicon-48x48.png',
  },
  manifest: '/favicon-48x48.png',
  openGraph: {
    title: "Savant Law - AI-Powered Legal Document Management",
    description: "Streamline your legal document creation, editing, and management with AI-powered tools.",
    type: "website",
    locale: "en_US",
    siteName: "Savant Law",
  },
  twitter: {
    card: "summary_large_image",
    title: "Savant Law - AI-Powered Legal Document Management",
    description: "Streamline your legal document creation, editing, and management with AI-powered tools.",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased transition-colors duration-300 min-h-screen min-w-full`}
      >
        <ThemeProvider>
          <LanguageProvider>
              {children}
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}