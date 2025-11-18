import { useEffect, useRef, useState } from 'react';

interface PreviousCluesDisplayProps {
  clues: string[];
  maxVisible?: number;
}

export function PreviousCluesDisplay({ clues, maxVisible = 2 }: PreviousCluesDisplayProps) {
  const [isOpen, setIsOpen] = useState(() => {
    // Default to open on desktop, closed on mobile
    // This initializer is safe and will work on both server and client
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 640;
    }
    return true; // Default to open for SSR
  });
  const detailsRef = useRef<HTMLDetailsElement>(null);

  // Set up resize listener on client mount
  useEffect(() => {
    // Listen for resize events (we don't change isOpen on resize - let user's toggle persist)
    const resizeHandler = () => {
      // Could update mobile state here if needed for other purposes
    };

    window.addEventListener('resize', resizeHandler);
    return () => window.removeEventListener('resize', resizeHandler);
  }, []);

  const visibleClues = clues.slice(0, maxVisible);

  // Don't render if there are no clues
  if (visibleClues.length === 0) {
    return null;
  }

  const handleToggle = (e: React.SyntheticEvent<HTMLDetailsElement>) => {
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
          <span>Previous Clues</span>
        </summary>

        <div className="mt-3 ml-4 space-y-2">
          {visibleClues.map((clue) => (
            <div
              key={clue}
              className={`p-3 rounded-md border ${
                clue === visibleClues[0]
                  ? 'border-primary bg-primary/5 font-medium text-foreground'
                  : 'border-muted-foreground/20 bg-muted/30 text-muted-foreground'
              }`}
            >
              {clue === visibleClues[0] && (
                <div className="text-sm font-semibold mb-1">Most Recent</div>
              )}
              <div className={clue === visibleClues[0] ? 'text-base' : 'text-sm opacity-70'}>
                {clue}
              </div>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
