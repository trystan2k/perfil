import { useEffect, useRef, useState } from 'react';

interface PreviousCluesDisplayProps {
  clues: string[];
  maxVisible?: number;
}

export function PreviousCluesDisplay({ clues, maxVisible = 2 }: PreviousCluesDisplayProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const detailsRef = useRef<HTMLDetailsElement>(null);

  // Initialize isMobile on client side after mount and set up resize listener
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };

    // Check on mount
    checkMobile();

    // Listen for resize events
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const visibleClues = clues.slice(0, maxVisible);

  // Don't render if there are no clues
  if (visibleClues.length === 0) {
    return null;
  }

  // On mobile, default to collapsed; on desktop, default to open
  const shouldStartCollapsed = isMobile;

  const handleToggle = (e: React.SyntheticEvent<HTMLDetailsElement>) => {
    setIsOpen(e.currentTarget.open);
  };

  return (
    <div className="mb-4">
      <details
        ref={detailsRef}
        open={!shouldStartCollapsed && isOpen}
        onToggle={handleToggle}
        className="group cursor-pointer"
      >
        <summary className="flex items-center gap-2 font-semibold text-base select-none hover:opacity-80 transition-opacity">
          <span className="inline-block w-4 h-4 text-xs leading-none">{isOpen ? '▼' : '▶'}</span>
          <span>Previous Clues</span>
        </summary>

        <div className="mt-3 ml-4 space-y-2">
          {visibleClues.map((clue, index) => (
            <div
              key={`${index}-${clue}`}
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
