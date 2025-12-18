import { useState } from 'react';
import { CompactHeader } from '@/components/CompactHeader';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { SettingsSheet } from '@/components/SettingsSheet';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { useAutoHideHeader } from '@/hooks/useAutoHideHeader';
import { GAME_CONFIG } from '@/config/gameConfig';
import type { SupportedLocale } from '@/i18n/locales';
import type { TranslationValue } from '@/i18n/utils';
import { ErrorBoundary } from './ErrorBoundary';
import { TranslateProvider, useTranslate } from './TranslateProvider';

interface HeaderProps {
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
   * Enable auto-hide on scroll (mobile only)
   * Default: true
   */
  enableAutoHide?: boolean;

  /**
   * Scroll threshold for auto-hide (pixels)
   * Default: GAME_CONFIG.ui.headerScrollThreshold
   */
  autoHideThreshold?: number;
}

export const Header = (props: HeaderProps) => {
  const { locale, translations, ...rest } = props;
  return (
    <TranslateProvider locale={locale} translations={translations}>
      <ErrorBoundary loggingContext="Header">
        <HeaderRaw {...rest} />
      </ErrorBoundary>
    </TranslateProvider>
  );
};

/**
 * Header: Complete header solution
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
 * <Header
 *   currentPath={currentPath}
 *   enableAutoHide={true}
 *   autoHideThreshold={50}
 * />
 * ```
 */
const HeaderRaw = ({
  currentPath,
  enableAutoHide = true,
  autoHideThreshold = GAME_CONFIG.ui.headerScrollThreshold,
}: Omit<HeaderProps, 'locale' | 'translations'>) => {
  const { t } = useTranslate();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
      />
      <SettingsSheet isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)}>
        {/* Settings sheet content - centered layout for all viewports */}
        <div className="flex flex-col items-center gap-3 w-full">
          <h3 className="text-sm font-semibold text-foreground">{t('header.themeLabel')}</h3>
          <div className="flex justify-center w-full">
            <ThemeSwitcher />
          </div>
        </div>

        <div className="flex flex-col items-center gap-3 w-full">
          <h3 className="text-sm font-semibold text-foreground">{t('header.languageLabel')}</h3>
          <div className="flex justify-center w-full">
            <LanguageSwitcher currentPath={currentPath} />
          </div>
        </div>
      </SettingsSheet>
    </>
  );
};
