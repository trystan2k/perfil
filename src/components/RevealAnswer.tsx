import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface RevealAnswerProps {
  answer?: string;
}

export function RevealAnswer({ answer = 'Sample Answer' }: RevealAnswerProps) {
  const [isRevealed, setIsRevealed] = useState(false);

  // Auto-hide after 3 seconds when revealed
  useEffect(() => {
    if (isRevealed) {
      const timer = setTimeout(() => {
        setIsRevealed(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isRevealed]);

  const handleDragEnd = (
    _event: unknown,
    info: { offset: { x: number }; velocity: { x: number } }
  ) => {
    const swipeThreshold = 100;
    const velocityThreshold = 500;

    // Detect right swipe: positive offset and sufficient distance or velocity
    if (info.offset.x > swipeThreshold || info.velocity.x > velocityThreshold) {
      setIsRevealed(true);
    }
  };

  return (
    <Card className="w-full max-w-2xl shadow-lg">
      <CardContent className="p-4 sm:p-6 md:p-8">
        {isRevealed ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="text-center space-y-3 sm:space-y-4 py-4 sm:py-6"
            data-testid="answer-revealed"
          >
            <p className="text-xs sm:text-sm text-muted-foreground uppercase tracking-wide">
              Answer
            </p>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-primary px-2">{answer}</p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2">Auto-hiding in 3s...</p>
          </motion.div>
        ) : (
          <motion.div
            className="text-center space-y-3 sm:space-y-4 py-8 sm:py-12 md:py-16 cursor-grab active:cursor-grabbing touch-pan-y select-none"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            whileTap={{ scale: 0.98 }}
            data-testid="swipe-area"
          >
            <motion.div
              animate={{ x: [0, 10, 0] }}
              transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2, ease: 'easeInOut' }}
              className="text-4xl sm:text-5xl mb-4"
            >
              👉
            </motion.div>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground font-medium px-4">
              Swipe right to reveal the answer
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground/70 mt-2">or tap and drag →</p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
