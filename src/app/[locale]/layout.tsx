import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ThemeProvider } from "@/components/ThemeProvider";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { SessionProviderClient } from "@/components/SessionProviderClient";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
  const messages: any = await getMessages();
  const title = messages.Metadata?.title || "Правда.Инфо | Проверенная информация и фактчекинг";
  const description = messages.Metadata?.description || "Платформа для получения проверенной информации о событиях, хронологии, географии и фактчекинга.";
  
  return {
    title: {
      template: `%s | ${title.split(' | ')[0]}`,
      default: title,
    },
    description: description,
    keywords: ["новости", "фактчекинг", "форум", "анонимное обсуждение", "хронология событий", "интерактивная карта", "news", "factcheck", "anonymous forum"],
    authors: [{ name: "Правда.Инфо" }],
    creator: "Правда.Инфо",
    publisher: "Правда.Инфо",
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    openGraph: {
      title: title,
      description: description,
      url: 'https://pravda-info.local', // Replace with actual domain in production
      siteName: title.split(' | ')[0],
      locale: locale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: description,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    alternates: {
      canonical: '/',
      languages: {
        'ru': '/ru',
        'en': '/en',
        'uk': '/uk',
        'de': '/de',
      },
    },
  };
}

export default async function RootLayout({
  children,
  params: { locale }
}: Readonly<{
  children: React.ReactNode;
  params: { locale: string };
}>) {
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen flex flex-col bg-gray-50 dark:bg-neutral-950 text-gray-900 dark:text-gray-100`}>
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <SessionProviderClient>
              <Navbar />
              <main className="flex-1 w-full flex flex-col">
                {children}
              </main>
              <Footer />
            </SessionProviderClient>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}