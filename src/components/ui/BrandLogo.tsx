import React, { useState, useEffect } from 'react';

interface BrandLogoProps {
  image?: string | null;
  name?: string | null;
  sizeClass?: string;
  textSizeClass?: string;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  image,
  name,
  sizeClass = 'w-8 h-8 rounded-lg',
  textSizeClass = 'text-sm',
  className = ''
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [image]);

  // Derive initial from name (or default to 'A' or 'C')
  const initial = name?.trim() ? name.trim().charAt(0).toUpperCase() : 'A';
  const hasValidImage = Boolean(image?.trim() && !imgFailed);

  return (
    <div
      className={`relative overflow-hidden bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center font-mono font-bold shadow-sm shrink-0 border border-zinc-200/60 dark:border-zinc-800 ${sizeClass} ${className}`}
    >
      {hasValidImage ? (
        <img
          src={image!.trim()}
          alt={name || 'Brand Logo'}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <span className={textSizeClass}>{initial}</span>
      )}
    </div>
  );
};

