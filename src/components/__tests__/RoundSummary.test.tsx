import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RoundSummary } from '../RoundSummary';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      if (key === 'gamePlay.roundSummary.title') {
        return 'Round Complete!';
      }
      if (key === 'gamePlay.roundSummary.profileName') {
        return `Profile: ${params?.name}`;
      }
      if (key === 'gamePlay.roundSummary.playerScored') {
        const count = params?.count as number;
        const suffix = count === 1 ? 'point' : 'points';
        return `${params?.playerName} scored ${count} ${suffix}!`;
      }
      if (key === 'gamePlay.roundSummary.noOneScored') {
        return 'No one scored this round';
      }
      if (key === 'gamePlay.roundSummary.nextProfileButton') {
        return 'Next Profile';
      }
      return key;
    },
  }),
}));

describe('RoundSummary', () => {
  it('should render with winner information', () => {
    const onContinue = vi.fn();

    render(
      <RoundSummary
        open={true}
        winnerName="Alice"
        pointsAwarded={15}
        profileName="Albert Einstein"
        onContinue={onContinue}
      />
    );

    expect(screen.getByText('Round Complete!')).toBeInTheDocument();
    expect(screen.getByText('Profile: Albert Einstein')).toBeInTheDocument();
    expect(screen.getByText('Alice scored 15 points!')).toBeInTheDocument();
    expect(screen.getByText('Next Profile')).toBeInTheDocument();
  });

  it('should render with no winner', () => {
    const onContinue = vi.fn();

    render(
      <RoundSummary
        open={true}
        winnerName={null}
        pointsAwarded={0}
        profileName="Marie Curie"
        onContinue={onContinue}
      />
    );

    expect(screen.getByText('Round Complete!')).toBeInTheDocument();
    expect(screen.getByText('Profile: Marie Curie')).toBeInTheDocument();
    expect(screen.getByText('No one scored this round')).toBeInTheDocument();
    expect(screen.getByText('Next Profile')).toBeInTheDocument();
  });

  it('should call onContinue when Next Profile button is clicked', async () => {
    const user = userEvent.setup();
    const onContinue = vi.fn();

    render(
      <RoundSummary
        open={true}
        winnerName="Bob"
        pointsAwarded={18}
        profileName="Leonardo da Vinci"
        onContinue={onContinue}
      />
    );

    const nextButton = screen.getByText('Next Profile');
    await user.click(nextButton);

    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it('should not render when open is false', () => {
    const onContinue = vi.fn();

    render(
      <RoundSummary
        open={false}
        winnerName="Charlie"
        pointsAwarded={12}
        profileName="Isaac Newton"
        onContinue={onContinue}
      />
    );

    // Dialog should not be visible
    expect(screen.queryByText('Round Complete!')).not.toBeInTheDocument();
  });

  it('should display different point values correctly', () => {
    const onContinue = vi.fn();

    const { rerender } = render(
      <RoundSummary
        open={true}
        winnerName="Dave"
        pointsAwarded={20}
        profileName="Stephen Hawking"
        onContinue={onContinue}
      />
    );

    expect(screen.getByText('Dave scored 20 points!')).toBeInTheDocument();

    rerender(
      <RoundSummary
        open={true}
        winnerName="Eve"
        pointsAwarded={5}
        profileName="Ada Lovelace"
        onContinue={onContinue}
      />
    );

    expect(screen.getByText('Eve scored 5 points!')).toBeInTheDocument();
  });

  it('should display different profile names correctly', () => {
    const onContinue = vi.fn();

    const { rerender } = render(
      <RoundSummary
        open={true}
        winnerName="Frank"
        pointsAwarded={10}
        profileName="Charles Darwin"
        onContinue={onContinue}
      />
    );

    expect(screen.getByText('Profile: Charles Darwin')).toBeInTheDocument();

    rerender(
      <RoundSummary
        open={true}
        winnerName="Grace"
        pointsAwarded={14}
        profileName="Nikola Tesla"
        onContinue={onContinue}
      />
    );

    expect(screen.getByText('Profile: Nikola Tesla')).toBeInTheDocument();
  });
});
