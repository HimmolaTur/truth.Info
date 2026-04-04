"use client";

import { Link } from "@/navigation";
import { Shield, Map, Clock, PenTool, FileText, MessageSquare, Menu, X } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useState } from "react";

export function Navbar() {
  const t = useTranslations("Navbar");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/news", icon: FileText, label: t("news") },
    { href: "/factcheck", icon: Shield, label: t("factcheck") },
    { href: "/map", icon: Map, label: t("map") },
    { href: "/timeline", icon: Clock, label: t("timeline") },
    { href: "/forum", icon: MessageSquare, label: t("forum") },
  ];

  return (
    <nav className="border-b border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center gap-2 text-blue-600">
              <Shield className="h-6 w-6" />
              <span className="font-bold text-xl tracking-tight text-gray-900 dark:text-white hidden sm:block">{t("title")}</span>
            </Link>
            <div className="hidden lg:ml-8 lg:flex lg:space-x-6">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600">
                  <link.icon className="w-4 h-4 mr-1" />
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <LanguageSwitcher />
            <ThemeToggle />
            <Link href="/submit" className="hidden sm:flex bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition items-center gap-2">
              <PenTool className="w-4 h-4" />
              {t("share")}
            </Link>
            <button 
              className="lg:hidden p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-md"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navLinks.map((link) => (
              <Link 
                key={link.href} 
                href={link.href} 
                className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-neutral-800 hover:text-blue-600"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <link.icon className="w-5 h-5 mr-3 text-gray-500" />
                {link.label}
              </Link>
            ))}
            <Link 
              href="/submit" 
              className="flex sm:hidden items-center px-3 py-2 mt-4 rounded-md text-base font-medium bg-blue-600 text-white hover:bg-blue-700"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <PenTool className="w-5 h-5 mr-3" />
              {t("share")}
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}