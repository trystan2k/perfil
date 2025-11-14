import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
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
});
