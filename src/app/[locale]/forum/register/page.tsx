"use client";

import { useState } from "react";
import { Link } from "@/navigation";
import Image from "next/image";
import { useLocale } from "next-intl";

const AVATARS = [
  "/avatars/avatar1.svg",
  "/avatars/avatar2.svg",
  "/avatars/avatar3.svg",
  "/avatars/avatar4.svg",
  "/avatars/avatar5.svg",
  "/avatars/avatar6.svg",
  "/avatars/avatar7.svg",
  "/avatars/avatar8.svg",
  "/avatars/avatar9.svg",
  "/avatars/avatar10.svg"
];

export default function RegisterPage() {
  const locale = useLocale();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, avatar_url: selectedAvatar }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Ошибка регистрации");
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
        <h1 className="text-2xl font-bold text-center mb-6">Регистрация на форуме</h1>
        
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
              placeholder="Придумайте логин"
            />
            <p className="text-xs text-gray-500 mt-1">
              Логин будет виден другим пользователям, но пароль никто не узнает.
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Пароль</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded-lg px-4 py-2.5 bg-gray-50 dark:bg-neutral-800 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Придумайте пароль"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Выберите аватарку</label>
            <div className="grid grid-cols-5 gap-2">
              {AVATARS.map((avatar, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedAvatar(avatar)}
                  className={`relative rounded-full overflow-hidden border-2 transition-all ${
                    selectedAvatar === avatar 
                      ? "border-blue-500 scale-110 shadow-md" 
                      : "border-transparent hover:border-gray-300"
                  }`}
                >
                  <Image 
                    src={avatar} 
                    alt={`Avatar ${idx + 1}`} 
                    width={60} 
                    height={60} 
                    className="bg-gray-100 dark:bg-neutral-800"
                  />
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Или она сгенерируется автоматически
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 mt-6"
          >
            {loading ? "Регистрация..." : "Зарегистрироваться"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          Уже есть аккаунт?{" "}
          <Link href="/forum/login" className="text-blue-600 hover:underline font-medium">
            Войти
          </Link>
        </div>
      </div>
    </div>
  );
}
