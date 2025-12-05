import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { customRender } from '../../../__mocks__/test-utils';
import { GamePlayHeader } from '../GamePlayHeader';

describe('GamePlayHeader', () => {
  const defaultProps = {
    title: 'Game Play',
    numberOfRounds: 5,
    roundInfoText: 'Round 1 of 5',
    categoryText: 'Category: Movies',
    currentProfileIndex: 2,
    totalProfiles: 10,
    profileProgressionText: 'Profile 2 of 10',
  };

  it('should render the title', () => {
    customRender(<GamePlayHeader {...defaultProps} />);

    expect(screen.getByText('Game Play')).toBeInTheDocument();
  });

  it('should render round info when numberOfRounds is greater than 1', () => {
    customRender(<GamePlayHeader {...defaultProps} numberOfRounds={3} />);

    expect(screen.getByText(/Round 1 of 5/)).toBeInTheDocument();
  });

  it('should not render round info when numberOfRounds is 1', () => {
    customRender(<GamePlayHeader {...defaultProps} numberOfRounds={1} />);

    // Round info should not be shown, only category and profile progression
    expect(screen.queryByText(/Round 1 of 5/)).not.toBeInTheDocument();
    expect(screen.getByText(/Category: Movies.*Profile 2 of 10/)).toBeInTheDocument();
  });

  it('should render category text', () => {
    customRender(<GamePlayHeader {...defaultProps} />);

    expect(screen.getByText(/Category: Movies/)).toBeInTheDocument();
  });

  it('should render profile progression text', () => {
    customRender(<GamePlayHeader {...defaultProps} />);

    const description = screen.getByText(/Round 1 of 5.*Category: Movies.*Profile 2 of 10/);
    expect(description).toBeInTheDocument();
    expect(description.textContent).toContain('Profile 2 of 10');
  });

  it('should render all text elements together', () => {
    customRender(<GamePlayHeader {...defaultProps} />);

    const description = screen.getByText(/Round 1 of 5.*Category: Movies.*Profile 2 of 10/);
    expect(description).toBeInTheDocument();
  });

  it('should handle different round numbers', () => {
    const { rerender } = customRender(
      <GamePlayHeader {...defaultProps} roundInfoText="Round 3 of 5" />
    );

    expect(screen.getByText(/Round 3 of 5/)).toBeInTheDocument();

    rerender(<GamePlayHeader {...defaultProps} roundInfoText="Round 5 of 5" numberOfRounds={5} />);

    expect(screen.getByText(/Round 5 of 5/)).toBeInTheDocument();
  });

  it('should handle different profile progression', () => {
    const { rerender } = customRender(
      <GamePlayHeader {...defaultProps} profileProgressionText="Profile 1 of 1" />
    );

    expect(screen.getByText(/Profile 1 of 1/)).toBeInTheDocument();

    rerender(<GamePlayHeader {...defaultProps} profileProgressionText="Profile 10 of 10" />);

    expect(screen.getByText(/Profile 10 of 10/)).toBeInTheDocument();
  });

  it('should render ProfileProgress component with correct props', () => {
    customRender(<GamePlayHeader {...defaultProps} currentProfileIndex={5} totalProfiles={20} />);

    // ProfileProgress renders an aria-label with progress info
    const progressElement = screen.getByLabelText(/Profile progress/);
    expect(progressElement).toBeInTheDocument();
  });

  it('should render the header as a Card component', () => {
    const { container } = customRender(<GamePlayHeader {...defaultProps} />);

    // Card should be present (it's the root element)
    expect(container.querySelector('[class*="rounded-lg"]')).toBeInTheDocument();
  });
});
