import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { RankedPlayer } from '@/hooks/useScoreboard';

interface SocialShareProps {
  winner: RankedPlayer;
  useTranslation: (key: string) => string;
}

export function SocialShare({ winner, useTranslation: t }: SocialShareProps) {
  const shareText = `I just won a game of Perfil! 🏆 Final score: ${winner.score} points. Can you beat my score? 🎮`;

  const handleShare = async (platform: 'twitter' | 'facebook' | 'copy') => {
    try {
      if (platform === 'copy') {
        await navigator.clipboard.writeText(shareText);
        alert(t('scoreboard.social.copied'));
      } else if (platform === 'twitter') {
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
      } else if (platform === 'facebook') {
        const url = `https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(shareText)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  return (
    <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {t('scoreboard.social.title')}
      </h3>
      <div className="grid grid-cols-3 gap-2">
        <Button
          onClick={() => handleShare('twitter')}
          variant="outline"
          className="w-full text-sm"
          aria-label={t('scoreboard.social.shareTwitter')}
        >
          <span aria-hidden="true">𝕏</span>
          <span className="sr-only">Share on X (Twitter)</span>
        </Button>
        <Button
          onClick={() => handleShare('facebook')}
          variant="outline"
          className="w-full text-sm"
          aria-label={t('scoreboard.social.shareFacebook')}
        >
          <span aria-hidden="true">f</span>
          <span className="sr-only">Share on Facebook</span>
        </Button>
        <Button
          onClick={() => handleShare('copy')}
          variant="outline"
          className="w-full text-sm"
          aria-label={t('scoreboard.social.copyLink')}
        >
          <span aria-hidden="true">📋</span>
          <span className="sr-only">Copy link to clipboard</span>
        </Button>
      </div>
    </Card>
  );
}
