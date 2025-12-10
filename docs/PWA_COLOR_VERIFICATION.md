# PWA Theme Color Verification Guide

## Overview

This document describes the PWA theme color configuration and manual verification steps for ensuring splash screens and address bar colors render correctly across devices.

## Configuration

### Manifest Theme Colors

**File:** `astro.config.mjs`

- **theme_color**: Uses primary color `#f8cf2a` (light mode) for address bar and browser chrome
- **background_color**: Uses background color `#f5f5f5` (light mode) for splash screen background

The PWA manifest is configured in `astro.config.mjs` with colors imported from `src/lib/theme-colors.ts`:

```typescript
manifest: {
  theme_color: PRIMARY_COLORS.light,  // #f8cf2a (bright yellow)
  background_color: THEME_COLORS.light, // #f5f5f5 (light grey)
}
```

### CSS Variables (Dark Mode)

**File:** `src/styles/globals.css`

Updated dark mode CSS variables for WCAG AA compliance:

- `--border: 0 0% 40%` (from 22%)
- `--muted-foreground: 0 0% 65%` (from 60%)
- `--input: 0 0% 22%` (from 16%)

These changes ensure all UI components meet WCAG AA contrast ratios.

## Manual Verification Checklist

### Android Chrome

1. **Install PWA**
   - Open the app in Chrome
   - Tap the install/add to home screen button
   - Verify splash screen appears with correct colors
   - Check that address bar and browser chrome use theme_color

2. **Splash Screen Colors**
   - Background should be light grey (`#f5f5f5`)
   - Logo/text should be visible with good contrast
   - Smooth transition from splash to app

3. **Address Bar Colors**
   - Address bar should display with theme_color (`#f8cf2a`)
   - Should be consistent with app branding

### iOS Safari

Note: iOS has limited PWA support compared to Android

1. **Add to Home Screen**
   - Use "Share" button → "Add to Home Screen"
   - iOS uses `apple-mobile-web-app-status-bar-style` (already configured)
   - Splash screens may be customized per Apple's design guidelines

2. **Status Bar Colors**
   - Status bar follows `status-bar-style` meta tag configuration
   - Current: default behavior

### Desktop Chrome/Edge

1. **Installation**
   - Click install button in address bar
   - Verify desktop app window shows correct theme colors

2. **Window Chrome**
   - Title bar should reflect theme_color if supported

## Devices Tested

Document any manual testing completed:

- [ ] Android Chrome (device/emulator: __________)
- [ ] iOS Safari (device/emulator: __________)  
- [ ] Desktop Chrome (OS: __________)
- [ ] Desktop Edge (OS: __________)

### Test Results

**Date:** [Test Date]
**Tester:** [Name]

#### Android Chrome
- Splash screen colors: ✓ / ✗ (notes: )
- Address bar color: ✓ / ✗ (notes: )
- Overall appearance: ✓ / ✗ (notes: )

#### iOS Safari
- Home screen icon: ✓ / ✗ (notes: )
- Status bar color: ✓ / ✗ (notes: )
- Overall appearance: ✓ / ✗ (notes: )

#### Desktop
- Theme colors apply: ✓ / ✗ (notes: )
- Installer UI: ✓ / ✗ (notes: )

## Color Values Reference

### Light Mode
- Primary: `#f8cf2a` (hsl: 48 94% 57%)
- Background: `#f5f5f5` (hsl: 0 0% 96%)
- Foreground: dark text

### Dark Mode  
- Primary: `#edb91d` (hsl: 45 85% 52%)
- Background: `#141414` (hsl: 0 0% 8%)
- Border: `#666666` (hsl: 0 0% 40%) - meets 3:1 contrast ratio
- Muted Foreground: `#a6a6a6` (hsl: 0 0% 65%)

## References

- [Web.dev PWA Colors](https://web.dev/add-a-web-app-manifest/)
- [WCAG 2.1 Contrast Requirements](https://www.w3.org/TR/WCAG21/#contrast-minimum)
- [MDN Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
