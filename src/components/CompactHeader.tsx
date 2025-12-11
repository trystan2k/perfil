import { Menu } from 'lucide-react';
import type { HTMLAttributes, ReactNode } from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { MEDIA_QUERIES } from '@/lib/breakpoints';
import { cn } from '@/lib/utils';

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

  /**
   * Children to render in the header
   * - Mobile: settings button + children (controls)
   * - Desktop: children inline
   */
  children?: ReactNode;

  /**
   * CSS class for the settings button icon
   */
  settingsButtonClassName?: string;

  /**
   * Aria label for settings button
   */
  settingsAriaLabel?: string;

  /**
   * Title for settings button
   */
  settingsTitle?: string;
}

/**
 * SettingsButton: Reusable settings icon button
 *
 * Renders a 48x48px touch target icon button for opening settings.
 * Used in both mobile and desktop header layouts.
 */
function SettingsButton({
  onClick,
  ariaLabel = 'Open settings',
  title = 'Settings',
  className,
}: {
  onClick?: () => void;
  ariaLabel?: string;
  title?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
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
      title={title}
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
  children,
  settingsButtonClassName,
  settingsAriaLabel = 'Open settings',
  settingsTitle = 'Settings',
  className,
  ...props
}: CompactHeaderProps) {
  // Use media query for responsive variant selection
  // Uses MEDIA_QUERIES.mobile from breakpoints.ts (derived from Tailwind config)
  const isMobile = useMediaQuery(MEDIA_QUERIES.mobile);

  // Determine actual variant to use
  const actualVariant = variant === 'auto' ? (isMobile ? 'mobile' : 'desktop') : variant;

  const isMobileVariant = actualVariant === 'mobile';

  return (
    <header
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
      {isMobileVariant ? (
        // Mobile variant: compact layout
        <div className="flex items-center justify-between h-16 px-4">
          {/* Controls/children on left side */}
          <div className="flex items-center gap-2">{children}</div>

          {/* Settings button on right */}
          <SettingsButton
            onClick={onSettingsClick}
            ariaLabel={settingsAriaLabel}
            title={settingsTitle}
            className={settingsButtonClassName}
          />
        </div>
      ) : (
        // Desktop variant: inline controls layout with settings button
        <div className="flex items-center justify-between h-16 px-6">
          {/* Left side: logo/branding (future use) */}
          <div className="flex-1" />

          {/* Right side: inline controls + settings button */}
          <div className="flex items-center gap-4">
            {children}

            {/* Settings button on right */}
            <SettingsButton
              onClick={onSettingsClick}
              ariaLabel={settingsAriaLabel}
              title={settingsTitle}
              className={settingsButtonClassName}
            />
          </div>
        </div>
      )}
    </header>
  );
}
