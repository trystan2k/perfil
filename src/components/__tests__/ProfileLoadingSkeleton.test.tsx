import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProfileLoadingSkeleton } from '@/components/ProfileLoadingSkeleton';

describe('ProfileLoadingSkeleton', () => {
  it('should render the skeleton container with correct aria attributes', () => {
    const { container } = render(<ProfileLoadingSkeleton />);
    const loader = container.querySelector('[aria-busy="true"]');

    expect(loader).toBeInTheDocument();
    expect(loader).toHaveAttribute('aria-busy', 'true');
    expect(loader).toHaveAttribute('aria-live', 'polite');
  });

  it('should render multiple skeleton elements for visual structure', () => {
    render(<ProfileLoadingSkeleton />);
    const skeletons = screen.getAllByTestId('skeleton');

    // Should have multiple skeleton elements (title, description, field labels, clues, buttons)
    expect(skeletons.length).toBeGreaterThan(5);
  });

  it('should have proper layout structure', () => {
    render(<ProfileLoadingSkeleton />);
    const card = screen.getAllByTestId('card')[0];

    expect(card).toBeInTheDocument();
    expect(card).toHaveClass('bg-card');
  });

  it('should not contain any interactive elements', () => {
    render(<ProfileLoadingSkeleton />);
    const buttons = screen.queryAllByRole('button');
    const inputs = screen.queryAllByRole('textbox');

    expect(buttons.length).toBe(0);
    expect(inputs.length).toBe(0);
  });

  it('should render placeholder skeletons for clues section', () => {
    render(<ProfileLoadingSkeleton />);
    const skeletons = screen.getAllByTestId('skeleton');

    // At least 3 skeletons for clues (based on component structure)
    expect(skeletons.length).toBeGreaterThanOrEqual(3);
  });
});
