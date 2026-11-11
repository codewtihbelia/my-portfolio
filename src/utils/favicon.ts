/**
 * Manages dynamic browser tab icon (favicon) updates based on profile image or site branding.
 */

export const updateAppFavicon = (iconUrl?: string | null) => {
  if (typeof document === 'undefined') return;

  const fallbackUrl = '/favicon.svg';
  const targetUrl = iconUrl?.trim() || fallbackUrl;

  const setFaviconHrefs = (href: string) => {
    const rels = ['icon', 'shortcut icon', 'apple-touch-icon'];

    rels.forEach((rel) => {
      let link = document.querySelector<HTMLLinkElement>(`link[rel='${rel}']`);
      if (!link) {
        link = document.createElement('link');
        link.rel = rel;
        document.head.appendChild(link);
      }

      if (href.startsWith('data:image/png')) {
        link.type = 'image/png';
      } else if (href.endsWith('.svg') || href.includes('image/svg')) {
        link.type = 'image/svg+xml';
      } else if (href.endsWith('.png')) {
        link.type = 'image/png';
      } else if (href.endsWith('.ico')) {
        link.type = 'image/x-icon';
      }

      link.href = href;
    });
  };

  if (!iconUrl?.trim() || iconUrl === fallbackUrl) {
    setFaviconHrefs(fallbackUrl);
    try {
      localStorage.removeItem('portfolio_profile_image');
      localStorage.removeItem('portfolio_favicon_data');
    } catch {
      // Ignore storage errors
    }
    return;
  }

  // Persist raw URL for pre-hydration in index.html
  try {
    localStorage.setItem('portfolio_profile_image', targetUrl);
  } catch {
    // Ignore storage errors
  }

  // Set directly first to ensure immediate browser tab response
  setFaviconHrefs(targetUrl);

  // Generate crisp circular avatar favicon with border via canvas
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const size = 64;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, size, size);

        // Circular clipping
        ctx.save();
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        // Center-crop drawing
        const naturalW = img.naturalWidth || img.width || size;
        const naturalH = img.naturalHeight || img.height || size;
        const minDim = Math.min(naturalW, naturalH);
        const sx = (naturalW - minDim) / 2;
        const sy = (naturalH - minDim) / 2;
        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
        ctx.restore();

        // Outer subtle border ring
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
        ctx.strokeStyle = '#4f46e5';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        const dataUrl = canvas.toDataURL('image/png');
        setFaviconHrefs(dataUrl);

        try {
          localStorage.setItem('portfolio_favicon_data', dataUrl);
        } catch {
          // Ignore storage errors
        }
      } catch {
        // Direct URL is already applied as fallback if canvas is tainted
      }
    };
    img.onerror = () => {
      // Direct URL already applied
    };
    img.src = targetUrl;
  } catch {
    // Direct URL is already applied
  }
};

