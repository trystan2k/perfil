import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ProfileLoadingSkeleton } from '@/components/ProfileLoadingSkeleton';

describe('ProfileLoadingSkeleton', () => {
  it('should render the skeleton container with correct aria attributes', () => {
    const { container } = render(<ProfileLoadingSkeleton />);
    const loader = container.querySelector('[aria-busy="true"]');

    expect(loader).toBeInTheDocument();
    expect(loader).toHaveAttribute('aria-busy', 'true');
    expect(loader).toHaveAttribute('aria-live', 'polite');
  });

  it('should have correct accessibility structure', () => {
    const { container } = render(<ProfileLoadingSkeleton />);
    const statusRegion = container.querySelector('[aria-busy="true"]');

    expect(statusRegion).toHaveAttribute('aria-busy', 'true');
    expect(statusRegion).toHaveAttribute('aria-live', 'polite');
  });

  it('should render multiple skeleton elements for visual structure', () => {
    const { container } = render(<ProfileLoadingSkeleton />);
    const skeletons = container.querySelectorAll('[class*="animate-pulse"]');

    // Should have multiple skeleton elements (title, description, field labels, clues, buttons)
    expect(skeletons.length).toBeGreaterThan(5);
  });

  it('should have proper layout structure', () => {
    const { container } = render(<ProfileLoadingSkeleton />);
    const card = container.querySelector('[class*="rounded-lg"]');

    expect(card).toBeInTheDocument();
    expect(card).toHaveClass('bg-card');
  });

  it('should not contain any interactive elements', () => {
    const { container } = render(<ProfileLoadingSkeleton />);
    const buttons = container.querySelectorAll('button');
    const inputs = container.querySelectorAll('input');

    expect(buttons.length).toBe(0);
    expect(inputs.length).toBe(0);
  });

  it('should render placeholder skeletons for clues section', () => {
    const { container } = render(<ProfileLoadingSkeleton />);
    const skeletons = container.querySelectorAll('[class*="animate-pulse"]');

    // At least 3 skeletons for clues (based on component structure)
    expect(skeletons.length).toBeGreaterThanOrEqual(3);
  });

  it('should have proper spacing and padding', () => {
    const { container } = render(<ProfileLoadingSkeleton />);
    const contentArea = container.querySelector('[class*="p-4"]');

    expect(contentArea).toBeInTheDocument();
  });
});
