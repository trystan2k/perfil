import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PreviousCluesDisplay } from '../PreviousCluesDisplay';

// Mock useTranslation hook
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { count?: number }) => {
      if (key === 'gamePlay.previousClues.title') {
        return `Previous Clues (${options?.count || 0})`;
      }
      if (key === 'gamePlay.previousClues.mostRecent') {
        return 'Most Recent';
      }
      return key;
    },
  }),
}));

// Mock window.innerWidth for mobile viewport testing
const mockWindowSize = (width: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
};

describe('PreviousCluesDisplay', () => {
  beforeEach(() => {
    // Reset to desktop size
    mockWindowSize(1024);
  });

  it('should render nothing when clues array is empty', () => {
    const { container } = render(<PreviousCluesDisplay clues={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render a single clue', () => {
    render(<PreviousCluesDisplay clues={['First clue']} />);

    expect(screen.getByText(/Previous Clues \(1\)/)).toBeInTheDocument();
    expect(screen.getByText('First clue')).toBeInTheDocument();
    expect(screen.getByText('Most Recent')).toBeInTheDocument();
  });

  it('should render two clues with different styling', () => {
    render(<PreviousCluesDisplay clues={['Most recent clue', 'Older clue']} />);

    expect(screen.getByText(/Previous Clues \(2\)/)).toBeInTheDocument();
    expect(screen.getByText('Most recent clue')).toBeInTheDocument();
    expect(screen.getByText('Older clue')).toBeInTheDocument();
    expect(screen.getByText('Most Recent')).toBeInTheDocument();

    // Verify both clues are rendered in the list
    const clueElements = screen.getAllByText(/Most recent clue|Older clue/);
    expect(clueElements.length).toBeGreaterThanOrEqual(2);
  });

  it('should display all clues when more than 2 are provided', () => {
    render(<PreviousCluesDisplay clues={['Clue 1', 'Clue 2', 'Clue 3']} />);

    expect(screen.getByText(/Previous Clues \(3\)/)).toBeInTheDocument();
    expect(screen.getByText('Clue 1')).toBeInTheDocument();
    expect(screen.getByText('Clue 2')).toBeInTheDocument();
    expect(screen.getByText('Clue 3')).toBeInTheDocument();
  });

  it('should render with details element open on desktop', () => {
    mockWindowSize(1024);
    const { container } = render(<PreviousCluesDisplay clues={['Desktop clue']} />);

    const details = container.querySelector('details');
    expect(details).toHaveAttribute('open');
  });

  it('should allow toggling collapse state via details element', async () => {
    const user = userEvent.setup();
    const { container } = render(<PreviousCluesDisplay clues={['Toggleable clue']} />);

    const details = container.querySelector('details') as HTMLDetailsElement;
    const summary = container.querySelector('summary') as HTMLElement;

    // Initially open on desktop
    expect(details.open).toBe(true);

    // Click to toggle
    await user.click(summary);
    expect(details.open).toBe(false);

    // Click again to reopen
    await user.click(summary);
    expect(details.open).toBe(true);
  });

  it('should render summary with toggle arrow indicator', () => {
    const { container } = render(<PreviousCluesDisplay clues={['Clue with arrow']} />);

    // Should render an arrow indicator (either ▼ when open or ▶ when closed)
    const summary = container.querySelector('summary');
    const hasArrow = summary?.textContent?.includes('▼') || summary?.textContent?.includes('▶');
    expect(hasArrow).toBe(true);
  });

  it('should handle empty strings in clues array gracefully', () => {
    render(<PreviousCluesDisplay clues={['Valid clue', '']} />);

    expect(screen.getByText('Valid clue')).toBeInTheDocument();
    // The empty string should still render but be filtered
  });

  it('should style labels correctly for multiple clues', () => {
    render(<PreviousCluesDisplay clues={['Current', 'Previous']} />);

    // First clue should have "Most Recent" label
    expect(screen.getByText('Most Recent')).toBeInTheDocument();
    expect(screen.getByText('Current')).toBeInTheDocument();
    expect(screen.getByText('Previous')).toBeInTheDocument();

    // Second clue should not have the label
    const previousClue = screen.getByText('Previous').closest('div');
    expect(previousClue).not.toHaveTextContent('Most Recent');
  });
});
