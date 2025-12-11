import { useState, useEffect } from 'react';
import { CompactHeader } from '@/components/CompactHeader';
import { SettingsSheet } from '@/components/SettingsSheet';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useAutoHideHeader } from '@/hooks/useAutoHideHeader';
import type { SupportedLocale } from '@/i18n/locales';
import type { TranslationValue } from '@/i18n/utils';

interface CompactHeaderWithProvidersProps {
  /**
   * Current locale for language switcher
   */
  locale: SupportedLocale;

  /**
   * Current path for language switcher links
   */
  currentPath: string;

  /**
   * Translation values for theme and language switchers
   */
  translations: TranslationValue;

  /**
   * Aria label for settings button (from server-side translations)
   */
  settingsAriaLabel?: string;

  /**
   * Title for settings button (from server-side translations)
   */
  settingsTitle?: string;

  /**
   * Title for the settings drawer (from server-side translations)
   */
  drawerTitle?: string;

  /**
   * Close aria label for the settings drawer (from server-side translations)
   */
  drawerCloseAriaLabel?: string;

  /**
   * Theme label for the settings drawer (from server-side translations)
   */
  themeLabel?: string;

  /**
   * Language label for the settings drawer (from server-side translations)
   */
  languageLabel?: string;

  /**
   * Enable auto-hide on scroll (mobile only)
   * Default: true
   */
  enableAutoHide?: boolean;

  /**
   * Scroll threshold for auto-hide (pixels)
   * Default: 50
   */
  autoHideThreshold?: number;
}

/**
 * CompactHeaderWithProviders: Complete header solution
 *
 * Combines:
 * - CompactHeader component (responsive header with settings button)
 * - SettingsSheet for all viewport sizes
 * - ThemeSwitcher (theme selection)
 * - LanguageSwitcher (language selection)
 * - Auto-hide on scroll functionality
 *
 * The settings drawer is now used on all viewport sizes for a consistent UX
 *
 * All text strings must be passed as props from the parent Astro component
 * to avoid context hook issues during server-side rendering.
 *
 * Usage:
 * ```tsx
 * <CompactHeaderWithProviders
 *   locale={currentLocale}
 *   currentPath={currentPath}
 *   translations={translations}
 *   settingsAriaLabel="Open settings"
 *   settingsTitle="Settings"
 *   drawerTitle="Settings"
 *   drawerCloseAriaLabel="Close settings"
 *   themeLabel="Theme"
 *   languageLabel="Language"
 *   enableAutoHide={true}
 * />
 * ```
 */
export function CompactHeaderWithProviders({
  locale,
  currentPath,
  translations,
  settingsAriaLabel = 'Open settings',
  settingsTitle = 'Settings',
  drawerTitle = 'Settings',
  drawerCloseAriaLabel = 'Close settings',
  themeLabel = 'Theme',
  languageLabel = 'Language',
  enableAutoHide = true,
  autoHideThreshold = 50,
}: CompactHeaderWithProvidersProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Close drawer when locale changes (after navigation)
  // This ensures drawer state is reset and components receive updated props
  // biome-ignore lint/correctness/useExhaustiveDependencies: locale is intentionally used to detect navigation
  useEffect(() => {
    setIsSettingsOpen(false);
  }, [locale]);

  const { isVisible } = useAutoHideHeader({
    enabled: enableAutoHide,
    threshold: autoHideThreshold,
  });

  return (
    <>
      <CompactHeader
        variant="auto"
        isVisible={isVisible}
        onSettingsClick={() => setIsSettingsOpen(true)}
        settingsAriaLabel={settingsAriaLabel}
        settingsTitle={settingsTitle}
      >
        {/* Settings button alone - all switchers are now in the drawer */}
      </CompactHeader>

      <SettingsSheet
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        title={drawerTitle}
        closeAriaLabel={drawerCloseAriaLabel}
      >
        {/* Settings sheet content - centered layout for all viewports */}
        <div className="flex flex-col items-center gap-3 w-full">
          <h3 className="text-sm font-semibold text-foreground">{themeLabel}</h3>
          <div className="flex justify-center w-full">
            <ThemeSwitcher key={locale} locale={locale} translations={translations} />
          </div>
        </div>

        <div className="flex flex-col items-center gap-3 w-full">
          <h3 className="text-sm font-semibold text-foreground">{languageLabel}</h3>
          <div className="flex justify-center w-full">
            <LanguageSwitcher
              key={locale}
              currentLocale={locale}
              currentPath={currentPath}
              locale={locale}
              translations={translations}
            />
          </div>
        </div>
      </SettingsSheet>
    </>
  );
}
