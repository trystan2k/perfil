import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { customRender } from '../../__mocks__/test-utils.tsx';
import { ProfileProgress } from '../ProfileProgress.tsx';

describe('ProfileProgress', () => {
  it('should render profile progress label correctly', () => {
    customRender(<ProfileProgress currentProfileIndex={3} totalProfiles={10} />);

    expect(screen.getByText('Profile 3 of 10')).toBeInTheDocument();
  });

  it('should render progress percentage correctly', async () => {
    customRender(<ProfileProgress currentProfileIndex={5} totalProfiles={10} />);

    // 5/10 = 50%
    await waitFor(() => {
      expect(screen.getByText('50%')).toBeInTheDocument();
    });
  });

  it('should render progress percentage for first profile', async () => {
    customRender(<ProfileProgress currentProfileIndex={1} totalProfiles={10} />);

    // 1/10 = 10%
    await waitFor(() => {
      expect(screen.getByText('10%')).toBeInTheDocument();
    });
  });
});
