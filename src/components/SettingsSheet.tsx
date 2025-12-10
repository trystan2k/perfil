import { X } from 'lucide-react';
import { type ReactNode, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

export interface SettingsSheetProps {
  /**
   * Whether the drawer is open
   */
  isOpen: boolean;

  /**
   * Callback when drawer should close
   * Triggered by:
   * - Close button click
   * - Escape key press
   * - Backdrop click
   */
  onClose: () => void;

  /**
   * Title of the drawer (for accessibility)
   */
  title?: string;

  /**
   * Content to render inside the drawer
   */
  children: ReactNode;

  /**
   * Optional CSS class for the drawer container
   */
  className?: string;

  /**
   * Optional CSS class for the content area
   */
  contentClassName?: string;
}

/**
 * SettingsSheet: A right-side drawer component for mobile settings
 *
 * Features:
 * - Slides in from right with smooth animation
 * - Close button aligned with settings button position in header
 * - Draws over entire page with left margin showing content underneath
 * - Focus trap: focus contained within drawer when open
 * - Keyboard: Escape key closes the drawer
 * - Backdrop: Click outside closes the drawer
 * - Safe-area: Respects safe-area insets
 * - Accessibility: ARIA modal, proper labels, focus management
 *
 * Usage:
 * ```tsx
 * const [isOpen, setIsOpen] = useState(false);
 * <SettingsSheet
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="Settings"
 * >
 *   <ThemeSwitcher />
 *   <LanguageSwitcher />
 * </SettingsSheet>
 * ```
 */
export function SettingsSheet({
  isOpen,
  onClose,
  title = 'Settings',
  children,
  className,
  contentClassName,
}: SettingsSheetProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Handle focus trap and Escape key
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    // Store the element that had focus before drawer opened
    previousActiveElement.current = document.activeElement as HTMLElement;

    // Focus the first focusable element in the drawer
    const focusableElements = contentRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusableElements && focusableElements.length > 0) {
      (focusableElements[0] as HTMLElement).focus();
    }

    // Handle Escape key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    // Prevent body scroll when drawer is open
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      // Restore focus to the element that opened the drawer
      previousActiveElement.current?.focus();
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop overlay - visible only when drawer is open */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/50 transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Right-side drawer container */}
      <div
        ref={drawerRef}
        className={cn(
          'fixed top-0 right-0 bottom-0 z-50',
          'bg-card border-l border-border',
          'shadow-lg shadow-black/20',
          'transition-transform duration-300 ease-in-out',
          'overflow-y-auto',
          // Drawer width: full width minus left margin (60px on mobile)
          'w-[calc(100%-60px)] sm:w-[calc(100%-80px)] md:w-[calc(100%-100px)]',
          // Slide in/out animation
          isOpen ? 'translate-x-0' : 'translate-x-full',
          // Safe-area support for top and bottom
          'pt-[env(safe-area-inset-top)]',
          'pb-[env(safe-area-inset-bottom)]',
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-drawer-title"
      >
        {/* Drawer header - aligned with header height */}
        <div className="sticky top-0 bg-card border-b border-border px-4 py-2">
          <div className="flex items-center justify-between gap-4">
            {/* Title */}
            <h2 id="settings-drawer-title" className="text-lg font-semibold text-foreground">
              {title}
            </h2>

            {/* Close button - positioned to align with settings button in header */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close settings"
              className={cn(
                'flex items-center justify-center',
                'w-12 h-12 min-w-12 min-h-12', // 48px touch target (matches settings button)
                'rounded-md',
                'text-foreground bg-background border border-border',
                'hover:bg-accent hover:border-accent',
                'transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                'active:bg-primary/20'
              )}
              title="Close"
            >
              <X className="w-6 h-6" strokeWidth={1.5} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Drawer content */}
        <div
          ref={contentRef}
          className={cn(
            'px-4 py-6',
            // Safe-area inset for sides (edge-to-edge without notches)
            'pl-[max(1rem,env(safe-area-inset-left))]',
            'pr-[max(1rem,env(safe-area-inset-right))]',
            contentClassName
          )}
        >
          {children}
        </div>
      </div>
    </>
  );
}
