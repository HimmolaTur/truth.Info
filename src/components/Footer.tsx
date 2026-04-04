import { Link } from "@/navigation";
import { useTranslations } from "next-intl";
import { Shield, Mail, Send } from "lucide-react";

export function Footer() {
  const t = useTranslations("Footer");
  const tNav = useTranslations("Navbar");

  return (
    <footer className="bg-white dark:bg-neutral-950 border-t border-gray-200 dark:border-neutral-800 mt-auto">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 text-blue-600 mb-4">
              <Shield className="h-8 w-8" />
              <span className="font-bold text-2xl tracking-tight text-gray-900 dark:text-white">
                {tNav("title")}
              </span>
            </Link>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mb-6 leading-relaxed">
              {t("description")}
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors">
                <span className="sr-only">Telegram</span>
                <Send className="h-6 w-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors">
                <span className="sr-only">Email</span>
                <Mail className="h-6 w-6" />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white tracking-wider uppercase mb-4">
              {t("navigation")}
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/news" className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors">
                  {tNav("news")}
                </Link>
              </li>
              <li>
                <Link href="/factcheck" className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors">
                  {tNav("factcheck")}
                </Link>
              </li>
              <li>
                <Link href="/map" className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors">
                  {tNav("map")}
                </Link>
              </li>
              <li>
                <Link href="/timeline" className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors">
                  {tNav("timeline")}
                </Link>
              </li>
              <li>
                <Link href="/forum" className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors">
                  {tNav("forum")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white tracking-wider uppercase mb-4">
              {t("legal")}
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/privacy" className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors">
                  {t("privacy")}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors">
                  {t("terms")}
                </Link>
              </li>
              <li>
                <Link href="/cookie" className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors">
                  {t("cookie")}
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-16 pt-8 border-t border-gray-200 dark:border-neutral-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-base text-gray-400">
            {t("copyright")}
          </p>
          <p className="text-sm text-gray-400 flex items-center gap-1">
            Made with <span className="text-red-500">♥</span> for the truth
          </p>
        </div>
      </div>
    </footer>
  );
}