type HeroBackdropProps = {
  imageUrl: string;
  className?: string;
};

/** Фон hero через inline style (не через arbitrary Tailwind-класс с url). */
export function HeroBackdrop({ imageUrl, className = "" }: HeroBackdropProps) {
  return (
    <div
      className={`absolute inset-0 bg-cover bg-center ${className}`}
      style={{ backgroundImage: `url(${imageUrl})` }}
      aria-hidden
    />
  );
}
