/** Small colour helpers used to keep admin-chosen brand colours readable (WCAG contrast). */
export const HEX6 = /^#[0-9a-fA-F]{6}$/;

function channel(v: number) {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}
export function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}
/** Contrast ratio between a colour and white (1–21). Buttons use white text on the brand colour. */
export function contrastWithWhite(hex: string): number {
  return 1.05 / (luminance(hex) + 0.05);
}
export function isReadableBrandColor(hex: string): boolean {
  return HEX6.test(hex) && contrastWithWhite(hex) >= 4.5;
}
