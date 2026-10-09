import { z } from "zod";

export type Branding = {
  /** Data URL: data:image/(png|jpeg|webp|svg+xml);base64,... */
  logo: string | null;
  colors: { accent: string };
};

export const DEFAULT_ACCENT = "#8B5CF6";
export const DEFAULT_BRANDING: Branding = { logo: null, colors: { accent: DEFAULT_ACCENT } };
export const PRESET_ACCENTS = ["#8B5CF6", "#2563EB", "#E8590C", "#0F9D76", "#111114"] as const;

export const LOGO_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"] as const;
export const MAX_LOGO_BYTES = 256 * 1024;

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
const LOGO_DATA_URL = /^data:image\/(png|jpeg|webp|svg\+xml);base64,([A-Za-z0-9+/]+={0,2})$/;

const WHITE_INK = "#FFFFFF";
const DARK_INK = "#111114";

export function isHexColor(value: string): boolean {
  return HEX_COLOR.test(value);
}

function relativeLuminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** White when it reaches WCAG AA large-text contrast (3:1) on `accent`, otherwise dark ink. */
export function accentInk(accent: string): string {
  const whiteContrast = 1.05 / (relativeLuminance(accent) + 0.05);
  return whiteContrast >= 3 ? WHITE_INK : DARK_INK;
}

function decodedBase64Bytes(base64: string): number {
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return (base64.length * 3) / 4 - padding;
}

const logoSchema = z
  .string()
  .refine((value) => {
    const match = LOGO_DATA_URL.exec(value);
    return match !== null && decodedBase64Bytes(match[2]) <= MAX_LOGO_BYTES;
  });

export const brandingSchema = z.object({
  logo: logoSchema.nullable(),
  colors: z.object({ accent: z.string().regex(HEX_COLOR) }),
}) satisfies z.ZodType<Branding>;
