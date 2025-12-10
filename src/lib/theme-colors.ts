/**
 * Theme colors for PWA manifest and browser chrome
 * Primary colors are used for theme_color to provide visual branding consistency
 * - Light: hsl(48 94% 57%) ≈ #f8cf2a (bright yellow for light mode)
 * - Dark: hsl(45 85% 52%) ≈ #edb91d (toned down yellow for dark mode)
 *
 * Background colors for splash screens
 * - Light: hsl(0 0% 96%) ≈ #f5f5f5
 * - Dark: hsl(0 0% 8%) ≈ #141414
 */
export const THEME_COLORS = {
  light: '#f5f5f5',
  dark: '#141414',
} as const;

export const PRIMARY_COLORS = {
  light: '#f8cf2a',
  dark: '#edb91d',
} as const;

export type ThemeColor = (typeof THEME_COLORS)[keyof typeof THEME_COLORS];
export type PrimaryColor = (typeof PRIMARY_COLORS)[keyof typeof PRIMARY_COLORS];
