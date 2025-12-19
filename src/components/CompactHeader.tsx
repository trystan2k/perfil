import { Menu } from 'lucide-react';
import type { HTMLAttributes } from 'react';
import { Logo } from '@/components/Logo';
import { cn } from '@/lib/utils';
import { useTranslate } from './TranslateProvider.tsx';

export interface CompactHeaderProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Variant: 'mobile' | 'desktop' | 'auto'
   * - 'mobile': always use compact mobile layout (56-64px)
   * - 'desktop': always use full desktop layout
   * - 'auto': responsive (mobile < md, desktop >= md)
   */
  variant?: 'mobile' | 'desktop' | 'auto';

  /**
   * Callback when settings button is clicked (mobile only)
   */
  onSettingsClick?: () => void;

  /**
   * Control header visibility for auto-hide functionality
   * When false, header is hidden (slides up off-screen)
   */
  isVisible?: boolean;
}

/**
 * SettingsButton: Reusable settings icon button
 *
 * Renders a 48x48px touch target icon button for opening settings.
 * Used in both mobile and desktop header layouts.
 */
function SettingsButton({ onClick, className }: { onClick?: () => void; className?: string }) {
  const { t } = useTranslate();
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={t('compactHeader.settingsAriaLabel')}
      aria-haspopup="dialog"
      className={cn(
        'flex items-center justify-center',
        'w-12 h-12 min-w-12 min-h-12', // 48px touch target (WCAG AAA)
        'rounded-md',
        'text-foreground bg-background border border-border',
        'hover:bg-accent hover:border-accent',
        'transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        'active:bg-primary/20',
        className
      )}
      title={t('compactHeader.settingsTitle')}
    >
      <Menu className="w-6 h-6" strokeWidth={1.5} aria-hidden="true" />
    </button>
  );
}

/**
 * CompactHeader: A responsive header component optimized for mobile
 *
 * Mobile (< md):
 * - Height: 60px (56-64px range)
 * - Shows settings icon button + minimal controls
 * - Settings accessible within 2 taps
 *
 * Desktop (>= md):
 * - Height: 97px (or full layout)
 * - Shows inline controls (ThemeSwitcher, LanguageSwitcher)
 * - No settings sheet needed
 *
 * Supports:
 * - Auto-hide on scroll (isVisible prop)
 * - Safe-area insets (notches, home indicator)
 * - Touch targets >= 48px with 8px spacing
 * - Keyboard & focus accessibility
 */
export function CompactHeader({
  variant = 'auto',
  onSettingsClick,
  isVisible = true,
  className,
  ...props
}: CompactHeaderProps) {
  return (
    <header
      data-testid="app-header"
      className={cn(
        // Base styles
        'sticky top-0 z-50 w-full bg-card border-b border-border shadow-sm',
        'transition-transform duration-300 ease-in-out',
        // Auto-hide: translate up when not visible
        !isVisible && '-translate-y-full',
        // Safe-area support for top inset (notches)
        'pt-[env(safe-area-inset-top)]',
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between h-16 px-6">
        {/* Center Logo */}
        <div className="flex-1 flex items-center justify-center z-10">
          <Logo />
        </div>

        {/* Settings button on right */}
        <SettingsButton onClick={onSettingsClick} className="absolute right-6 z-10" />
      </div>
    </header>
  );
}
