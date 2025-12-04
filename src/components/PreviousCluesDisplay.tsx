import { type SyntheticEvent, useRef, useState } from 'react';
import { useTranslation } from '@/hooks/useTranslations';

interface PreviousCluesDisplayProps {
  clues: string[];
}

export function PreviousCluesDisplay({ clues }: PreviousCluesDisplayProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false); // Default to closed
  const detailsRef = useRef<HTMLDetailsElement>(null);

  // Don't render if there are no clues
  if (clues.length === 0) {
    return null;
  }

  const handleToggle = (e: SyntheticEvent<HTMLDetailsElement>) => {
    setIsOpen(e.currentTarget.open);
  };

  return (
    <div className="mb-4">
      <details
        ref={detailsRef}
        open={isOpen}
        onToggle={handleToggle}
        className="group cursor-pointer"
      >
        <summary className="flex items-center gap-2 font-semibold text-base select-none hover:opacity-80 transition-opacity">
          <span className="inline-block w-4 h-4 text-xs leading-none">{isOpen ? '▼' : '▶'}</span>
          <span>{t('gamePlay.previousClues.title', { count: clues.length })}</span>
        </summary>

        <div className="mt-3 ml-4 space-y-2">
          {clues.map((clue, index) => (
            <div
              key={`${index}-${clue}`}
              className={`p-3 rounded-md border ${
                index === 0
                  ? 'border-primary bg-primary/5 font-medium text-foreground'
                  : 'border-muted-foreground/20 bg-muted/30 text-muted-foreground'
              }`}
            >
              {index === 0 && (
                <div className="text-sm font-semibold mb-1">
                  {t('gamePlay.previousClues.mostRecent')}
                </div>
              )}
              <div className={index === 0 ? 'text-base' : 'text-sm opacity-70'}>{clue}</div>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
