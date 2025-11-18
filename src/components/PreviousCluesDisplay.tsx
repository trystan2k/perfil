import { useState } from 'react';

interface PreviousCluesDisplayProps {
  clues: string[];
  maxVisible?: number;
}

export function PreviousCluesDisplay({ clues, maxVisible = 2 }: PreviousCluesDisplayProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const visibleClues = clues.slice(0, maxVisible);

  // Don't render if there are no clues
  if (visibleClues.length === 0) {
    return null;
  }

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const shouldBeCollapsible = isMobile;
  const isActuallyCollapsed = shouldBeCollapsible && isCollapsed;

  return (
    <div className="mb-4">
      <details
        open={!isActuallyCollapsed}
        onToggle={(e) => {
          setIsCollapsed(!e.currentTarget.open);
        }}
        className="group cursor-pointer"
      >
        <summary className="flex items-center gap-2 font-semibold text-base select-none hover:opacity-80 transition-opacity">
          <span className="inline-block w-4 h-4 text-xs leading-none">
            {isActuallyCollapsed ? '▶' : '▼'}
          </span>
          <span>Previous Clues</span>
        </summary>

        <div className="mt-3 ml-4 space-y-2">
          {visibleClues.map((clue, index) => (
            <div
              key={clue}
              className={`p-3 rounded-md border ${
                index === 0
                  ? 'border-primary bg-primary/5 font-medium text-foreground'
                  : 'border-muted-foreground/20 bg-muted/30 text-muted-foreground'
              }`}
            >
              {index === 0 ? <div className="text-sm font-semibold mb-1">Most Recent</div> : null}
              <div className={index === 0 ? 'text-base' : 'text-sm opacity-70'}>{clue}</div>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
