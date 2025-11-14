import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ProfileProgress } from '../ProfileProgress';

describe('ProfileProgress', () => {
  it('should render profile progress label correctly', () => {
    render(<ProfileProgress currentProfileIndex={3} totalProfiles={10} />);

    expect(screen.getByText('Profile 3 of 10')).toBeInTheDocument();
  });

  it('should render progress percentage correctly', () => {
    render(<ProfileProgress currentProfileIndex={5} totalProfiles={10} />);

    // 5/10 = 50%
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('should render progress percentage for first profile', () => {
    render(<ProfileProgress currentProfileIndex={1} totalProfiles={10} />);

    // 1/10 = 10%
    expect(screen.getByText('10%')).toBeInTheDocument();
  });

  it('should render progress percentage for last profile', () => {
    render(<ProfileProgress currentProfileIndex={10} totalProfiles={10} />);

    // 10/10 = 100%
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('should render progress bar with correct aria-label', () => {
    render(<ProfileProgress currentProfileIndex={7} totalProfiles={15} />);

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-label', 'Profile progress: 7 of 15');
  });

  it('should calculate progress percentage correctly for various inputs', () => {
    const { rerender } = render(<ProfileProgress currentProfileIndex={2} totalProfiles={8} />);

    // 2/8 = 25%
    expect(screen.getByText('25%')).toBeInTheDocument();

    rerender(<ProfileProgress currentProfileIndex={3} totalProfiles={12} />);

    // 3/12 = 25%
    expect(screen.getByText('25%')).toBeInTheDocument();

    rerender(<ProfileProgress currentProfileIndex={7} totalProfiles={14} />);

    // 7/14 = 50%
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('should round progress percentage to nearest integer', () => {
    render(<ProfileProgress currentProfileIndex={1} totalProfiles={3} />);

    // 1/3 = 33.33... should round to 33%
    expect(screen.getByText('33%')).toBeInTheDocument();
  });

  it('should handle edge case with 1 total profile', () => {
    render(<ProfileProgress currentProfileIndex={1} totalProfiles={1} />);

    expect(screen.getByText('Profile 1 of 1')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
  });
});
