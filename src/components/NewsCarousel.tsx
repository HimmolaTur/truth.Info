"use client";

import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { Link } from '@/navigation';
import { useTranslations } from 'next-intl';

export function NewsCarousel({ news }: { news: any[] }) {
  const t = useTranslations("NewsCarousel");
  const [emblaRef] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 5000 })]);

  if (!news || news.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-2xl shadow-xl border border-gray-100 dark:border-neutral-800" ref={emblaRef}>
      <div className="flex">
        {news.map((item) => (
          <div key={item.id} className="flex-[0_0_100%] min-w-0 relative h-[400px] md:h-[500px]">
            <img 
              src={item.image_url || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1000&auto=format&fit=crop'} 
              alt={item.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
            
            <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 flex flex-col justify-end">
              <div className="flex items-center gap-3 mb-4">
                {item.is_important && (
                  <span className="bg-red-600 text-white text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                    {t("urgent")}
                  </span>
                )}
                <span className="bg-blue-600/80 backdrop-blur-md text-white text-xs px-3 py-1 rounded-full font-medium">
                  {item.category}
                </span>
              </div>
              
              <Link href={`/news/${item.id}`}>
                <h2 className="text-2xl md:text-4xl font-bold text-white mb-3 hover:text-blue-400 transition-colors line-clamp-2">
                  {item.title}
                </h2>
              </Link>
              
              <p className="text-gray-300 line-clamp-2 md:line-clamp-3 max-w-3xl text-sm md:text-base">
                {item.content}
              </p>
              
              <div className="mt-6">
                <Link href={`/news/${item.id}`} className="inline-flex items-center text-white font-medium hover:text-blue-400 transition-colors">
                  {t("readMore")} <span className="ml-2">→</span>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}