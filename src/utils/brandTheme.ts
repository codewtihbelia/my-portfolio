// Brand Theme Utility & Dynamic Color Generation
// Dynamically overrides Tailwind v4 theme variables (--color-indigo-*) and brand tokens

export interface BrandPreset {
  id: string;
  name: string;
  hex: string;
  description: string;
  shades: Record<string, string>;
}

export const BRAND_PRESETS: BrandPreset[] = [
  {
    id: "indigo",
    name: "Indigo",
    hex: "#6366f1",
    description: "Modern, high-tech signature",
    shades: {
      "50": "oklch(96.2% 0.018 272.314)",
      "100": "oklch(93% 0.034 272.788)",
      "200": "oklch(87% 0.065 274.039)",
      "300": "oklch(78.5% 0.115 274.713)",
      "400": "oklch(67.3% 0.182 276.935)",
      "500": "oklch(58.5% 0.233 277.117)",
      "600": "#6366f1",
      "700": "oklch(45.7% 0.24 277.023)",
      "800": "oklch(39.8% 0.195 277.366)",
      "900": "oklch(35.9% 0.144 278.697)",
      "950": "oklch(25.7% 0.09 281.288)",
    },
  },
  {
    id: "emerald",
    name: "Emerald",
    hex: "#10b981",
    description: "Fresh, organic forest green",
    shades: {
      "50": "oklch(97.9% 0.021 166.113)",
      "100": "oklch(95% 0.052 163.051)",
      "200": "oklch(90.5% 0.093 164.15)",
      "300": "oklch(84.5% 0.143 164.978)",
      "400": "oklch(76.5% 0.177 163.223)",
      "500": "oklch(69.6% 0.17 162.48)",
      "600": "#10b981",
      "700": "oklch(50.8% 0.118 165.612)",
      "800": "oklch(43.2% 0.095 166.913)",
      "900": "oklch(37.8% 0.077 168.94)",
      "950": "oklch(26.2% 0.051 172.552)",
    },
  },
  {
    id: "sky",
    name: "Sky Blue",
    hex: "#0ea5e9",
    description: "Crisp, electric oceanic blue",
    shades: {
      "50": "oklch(97.7% 0.013 236.62)",
      "100": "oklch(95.1% 0.026 236.824)",
      "200": "oklch(90.1% 0.058 230.902)",
      "300": "oklch(82.8% 0.111 230.318)",
      "400": "oklch(74.6% 0.16 232.661)",
      "500": "oklch(68.5% 0.169 237.323)",
      "600": "#0ea5e9",
      "700": "oklch(50% 0.134 242.749)",
      "800": "oklch(44.3% 0.11 240.79)",
      "900": "oklch(39.1% 0.09 240.876)",
      "950": "oklch(29.3% 0.066 243.157)",
    },
  },
  {
    id: "violet",
    name: "Violet",
    hex: "#8b5cf6",
    description: "Deep creative royal purple",
    shades: {
      "50": "oklch(96.9% 0.016 293.756)",
      "100": "oklch(94.3% 0.029 294.588)",
      "200": "oklch(89.4% 0.057 293.283)",
      "300": "oklch(81.1% 0.111 293.571)",
      "400": "oklch(70.2% 0.183 293.541)",
      "500": "oklch(60.6% 0.25 292.717)",
      "600": "#8b5cf6",
      "700": "oklch(49.1% 0.27 292.581)",
      "800": "oklch(43.2% 0.232 292.759)",
      "900": "oklch(38% 0.189 293.745)",
      "950": "oklch(28.3% 0.141 291.089)",
    },
  },
  {
    id: "rose",
    name: "Rose",
    hex: "#f43f5e",
    description: "Vibrant, bold crimson rose",
    shades: {
      "50": "oklch(96.9% 0.015 12.422)",
      "100": "oklch(94.1% 0.03 12.58)",
      "200": "oklch(89.2% 0.058 10.001)",
      "300": "oklch(81% 0.117 11.638)",
      "400": "oklch(71.2% 0.194 13.428)",
      "500": "oklch(64.5% 0.246 16.439)",
      "600": "#f43f5e",
      "700": "oklch(51.4% 0.222 16.935)",
      "800": "oklch(45.5% 0.188 13.697)",
      "900": "oklch(41% 0.159 10.272)",
      "950": "oklch(27.1% 0.105 12.094)",
    },
  },
  {
    id: "amber",
    name: "Amber",
    hex: "#f59e0b",
    description: "Warm, energetic golden sun",
    shades: {
      "50": "oklch(98.7% 0.022 95.277)",
      "100": "oklch(96.2% 0.059 95.617)",
      "200": "oklch(92.4% 0.12 95.746)",
      "300": "oklch(87.9% 0.169 91.605)",
      "400": "oklch(82.8% 0.189 84.429)",
      "500": "oklch(76.9% 0.188 70.08)",
      "600": "#f59e0b",
      "700": "oklch(55.5% 0.163 48.998)",
      "800": "oklch(47.3% 0.137 46.201)",
      "900": "oklch(41.4% 0.112 45.904)",
      "950": "oklch(27.9% 0.077 45.635)",
    },
  },
  {
    id: "cyan",
    name: "Cyan",
    hex: "#06b6d4",
    description: "Futuristic, lucid neon cyan",
    shades: {
      "50": "oklch(98.4% 0.019 200.873)",
      "100": "oklch(95.6% 0.045 203.388)",
      "200": "oklch(91.7% 0.08 205.041)",
      "300": "oklch(86.5% 0.127 207.078)",
      "400": "oklch(78.9% 0.154 211.53)",
      "500": "oklch(71.5% 0.143 215.221)",
      "600": "#06b6d4",
      "700": "oklch(52% 0.105 223.128)",
      "800": "oklch(45% 0.085 224.283)",
      "900": "oklch(39.8% 0.07 227.392)",
      "950": "oklch(30.2% 0.056 229.695)",
    },
  },
  {
    id: "blue",
    name: "Royal Blue",
    hex: "#2563eb",
    description: "Authoritative, classic cobalt blue",
    shades: {
      "50": "oklch(97% 0.014 254.604)",
      "100": "oklch(93.2% 0.032 255.585)",
      "200": "oklch(88.2% 0.059 254.128)",
      "300": "oklch(80.9% 0.105 251.813)",
      "400": "oklch(70.7% 0.165 254.624)",
      "500": "oklch(62.3% 0.214 259.815)",
      "600": "#2563eb",
      "700": "oklch(48.8% 0.243 264.376)",
      "800": "oklch(42.4% 0.199 265.638)",
      "900": "oklch(37.9% 0.146 265.522)",
      "950": "oklch(28.2% 0.091 267.935)",
    },
  },
  {
    id: "teal",
    name: "Teal",
    hex: "#14b8a6",
    description: "Balanced, sophisticated sea green",
    shades: {
      "50": "oklch(98.4% 0.014 180.72)",
      "100": "oklch(95.3% 0.051 180.801)",
      "200": "oklch(91% 0.096 180.426)",
      "300": "oklch(85.5% 0.138 181.071)",
      "400": "oklch(77.7% 0.152 181.912)",
      "500": "oklch(70.4% 0.14 182.503)",
      "600": "#14b8a6",
      "700": "oklch(51.1% 0.096 186.391)",
      "800": "oklch(43.7% 0.078 188.216)",
      "900": "oklch(38.6% 0.063 188.416)",
      "950": "oklch(27.7% 0.046 192.524)",
    },
  },
  {
    id: "orange",
    name: "Orange",
    hex: "#f97316",
    description: "Dynamic, creative fiery orange",
    shades: {
      "50": "oklch(98% 0.016 73.684)",
      "100": "oklch(95.4% 0.038 75.164)",
      "200": "oklch(90.1% 0.076 70.697)",
      "300": "oklch(83.7% 0.128 66.29)",
      "400": "oklch(75% 0.183 55.934)",
      "500": "oklch(70.5% 0.213 47.604)",
      "600": "#f97316",
      "700": "oklch(55.3% 0.195 38.402)",
      "800": "oklch(47% 0.157 37.304)",
      "900": "oklch(40.8% 0.123 38.172)",
      "950": "oklch(26.6% 0.079 36.259)",
    },
  },
];

export const DEFAULT_BRAND_COLOR = "#6366f1";

// Helper: Normalize hex string
export function normalizeHex(hex: string): string {
  if (!hex) return DEFAULT_BRAND_COLOR;
  let clean = hex.trim().replace(/^#/, "");
  if (clean.length === 3) {
    clean = clean
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) {
    return DEFAULT_BRAND_COLOR;
  }
  return `#${clean.toLowerCase()}`;
}

// Convert Hex to RGB
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const norm = normalizeHex(hex).slice(1);
  const num = parseInt(norm, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

// Convert RGB to HSL
export function rgbToHsl(
  r: number,
  g: number,
  b: number,
): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

// Convert HSL to Hex
export function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  const sNorm = Math.max(0, Math.min(100, s)) / 100;
  const lNorm = Math.max(0, Math.min(100, l)) / 100;
  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lNorm - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;

  if (h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    g = 0;
    b = c;
  } else {
    r = c;
    g = 0;
    b = x;
  }

  const toHex = (val: number) =>
    Math.round((val + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Generate complete 50-950 color scale from any custom hex
export function generateShadesFromHex(baseHex: string): Record<string, string> {
  const cleanHex = normalizeHex(baseHex);

  // Check if it matches an official preset exactly or closely
  const matchingPreset = BRAND_PRESETS.find(
    (p) => p.hex.toLowerCase() === cleanHex.toLowerCase(),
  );
  if (matchingPreset) {
    return matchingPreset.shades;
  }

  const rgb = hexToRgb(cleanHex);
  const { h, s, l } = rgbToHsl(rgb.r, rgb.g, rgb.b);

  return {
    "50": hslToHex(h, Math.min(s, 70), 96),
    "100": hslToHex(h, Math.min(s, 75), 92),
    "200": hslToHex(h, Math.min(s, 80), 84),
    "300": hslToHex(h, Math.min(s, 85), 74),
    "400": hslToHex(h, Math.min(s, 90), 62),
    "500": hslToHex(h, s, Math.min(52, l + 8)),
    "600": cleanHex,
    "700": hslToHex(h, s, Math.max(22, l - 8)),
    "800": hslToHex(h, s, Math.max(16, l - 16)),
    "900": hslToHex(h, s, Math.max(10, l - 24)),
    "950": hslToHex(h, s, Math.max(6, l - 30)),
  };
}

const STYLE_TAG_ID = "dynamic-brand-theme";
const STORAGE_KEY = "portfolio_brand_color";

/**
 * Applies the given primary brand color to the DOM:
 * 1. Overrides Tailwind v4's --color-indigo-* tokens across all shades.
 * 2. Defines custom --brand-primary and --color-brand variables.
 * 3. Injects unlayered CSS rules with highest priority.
 * 4. Updates browser address bar theme-color meta tag.
 * 5. Caches color in localStorage for instant restoration on subsequent page reloads.
 */
export function applyBrandColorToDom(hexColor?: string): void {
  if (typeof window === "undefined") return;

  const validHex = normalizeHex(hexColor || DEFAULT_BRAND_COLOR);
  const shades = generateShadesFromHex(validHex);

  // 1. Set inline CSS custom properties on documentElement for direct reactivity
  const root = document.documentElement;
  Object.entries(shades).forEach(([shade, value]) => {
    root.style.setProperty(`--color-indigo-${shade}`, value);
  });
  root.style.setProperty("--brand-primary", validHex);
  root.style.setProperty("--color-brand", validHex);
  root.style.setProperty("--color-brand-600", validHex);
  root.style.setProperty("--color-brand-500", shades["500"]);
  root.style.setProperty("--color-brand-700", shades["700"]);
  root.style.setProperty("--color-brand-light", shades["50"]);
  root.style.setProperty("--color-brand-dark", shades["900"]);

  // 2. Inject or update the global unlayered <style> element
  // Unlayered styles in CSS have higher specificity than Tailwind's @layer theme
  let styleEl = document.getElementById(
    STYLE_TAG_ID,
  ) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = STYLE_TAG_ID;
    document.head.appendChild(styleEl);
  }

  const cssRules = `
    :root, html, [data-theme] {
      --brand-primary: ${validHex} !important;
      --color-brand: ${validHex} !important;
      --color-brand-600: ${validHex} !important;
      --color-brand-500: ${shades["500"]} !important;
      --color-brand-700: ${shades["700"]} !important;
      --color-brand-light: ${shades["50"]} !important;
      --color-brand-dark: ${shades["900"]} !important;
      --color-indigo-50: ${shades["50"]} !important;
      --color-indigo-100: ${shades["100"]} !important;
      --color-indigo-200: ${shades["200"]} !important;
      --color-indigo-300: ${shades["300"]} !important;
      --color-indigo-400: ${shades["400"]} !important;
      --color-indigo-500: ${shades["500"]} !important;
      --color-indigo-600: ${shades["600"]} !important;
      --color-indigo-700: ${shades["700"]} !important;
      --color-indigo-800: ${shades["800"]} !important;
      --color-indigo-900: ${shades["900"]} !important;
      --color-indigo-950: ${shades["950"]} !important;
    }
  `;
  styleEl.textContent = cssRules;

  // 3. Update meta theme-color tag if present
  let metaTheme = document.querySelector('meta[name="theme-color"]');
  if (!metaTheme) {
    metaTheme = document.createElement("meta");
    metaTheme.setAttribute("name", "theme-color");
    document.head.appendChild(metaTheme);
  }
  metaTheme.setAttribute("content", validHex);

  // 4. Save to local storage for instant zero-flash boot
  try {
    localStorage.setItem(STORAGE_KEY, validHex);
  } catch (e) {
    // LocalStorage may be blocked in some private environments
  }
}

/**
 * Retrieves the currently saved brand color from localStorage, or defaults to indigo.
 */
export function getStoredBrandColor(): string {
  if (typeof window === "undefined") return DEFAULT_BRAND_COLOR;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? normalizeHex(saved) : DEFAULT_BRAND_COLOR;
  } catch {
    return DEFAULT_BRAND_COLOR;
  }
}

/**
 * Generates an adaptive, harmonious palette for analytics charts (bars, donut slices, legends)
 * directly derived from the active brand color.
 */
export function getAnalyticsChartPalette(baseHex?: string): string[] {
  const primary = normalizeHex(baseHex || getStoredBrandColor());
  const rgb = hexToRgb(primary);
  const { h, s, l } = rgbToHsl(rgb.r, rgb.g, rgb.b);

  // 1. Primary: Brand color itself (e.g. for Traffic bar chart and Desktop slice)
  // 2. Secondary: Harmonious complementary/analogous accent (e.g. for Mobile slice)
  const secondary = hslToHex(
    (h + 40) % 360,
    Math.max(60, Math.min(90, s)),
    Math.max(45, Math.min(58, l)),
  );
  // 3. Tertiary: Harmonic contrast tone (e.g. for Tablet slice)
  const tertiary = hslToHex(
    (h + 175) % 360,
    Math.max(55, Math.min(85, s)),
    Math.max(48, Math.min(62, l)),
  );
  // 4. Quaternary: Subtle accent tone
  const quaternary = hslToHex(
    (h + 215) % 360,
    Math.max(50, Math.min(80, s)),
    Math.max(52, Math.min(66, l)),
  );

  return [primary, secondary, tertiary, quaternary];
}
