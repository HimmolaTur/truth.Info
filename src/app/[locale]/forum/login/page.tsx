"use client";

import { useState } from "react";
import { Link } from "@/navigation";
import { useTranslations, useLocale } from "next-intl";

export default function LoginPage() {
  const t = useTranslations("Forum");
  const locale = useLocale();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Ошибка входа");
      }

      window.location.href = `/${locale}/forum`;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-12">
      <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl shadow-lg border p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-center mb-6">Вход на форум</h1>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Логин</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border rounded-lg px-4 py-2.5 bg-gray-50 dark:bg-neutral-800 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Ваш логин"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Пароль</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded-lg px-4 py-2.5 bg-gray-50 dark:bg-neutral-800 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Ваш пароль"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? "Вход..." : "Войти"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          Нет аккаунта?{" "}
          <Link href="/forum/register" className="text-blue-600 hover:underline font-medium">
            Зарегистрироваться
          </Link>
        </div>
      </div>
    </div>
  );
}
