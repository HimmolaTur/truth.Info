"use client";

import { Paperclip, Loader2 } from "lucide-react";
import { useState } from "react";

export function FileUploadButton({ targetId }: { targetId: string }) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      
      if (data.url) {
        const ta = document.getElementById(targetId) as HTMLTextAreaElement;
        if (ta) {
          const isImg = data.url.match(/\.(jpg|jpeg|png|gif|webp)$/i);
          const markdown = isImg ? `\n![Изображение](${data.url})\n` : `\n[Прикрепленный файл](${data.url})\n`;
          
          // Insert at cursor position or append
          const start = ta.selectionStart;
          const end = ta.selectionEnd;
          const text = ta.value;
          ta.value = text.substring(0, start) + markdown + text.substring(end);
          
          // Move cursor after inserted text
          ta.selectionStart = ta.selectionEnd = start + markdown.length;
          ta.focus();
        }
      }
    } catch (err) {
      console.error("Upload error", err);
      alert("Ошибка при загрузке файла");
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  return (
    <label className={`cursor-pointer flex items-center justify-center gap-2 px-4 py-2 border dark:border-neutral-700 rounded-md bg-gray-50 dark:bg-neutral-800 text-sm font-medium hover:bg-gray-100 dark:hover:bg-neutral-700 transition ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
      {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
      <span>{uploading ? 'Загрузка...' : 'Прикрепить файл'}</span>
      <input type="file" className="hidden" accept="image/*,.pdf,.doc,.docx,.txt,.zip" onChange={handleUpload} disabled={uploading} />
    </label>
  );
}
