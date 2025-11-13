import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useGameStore } from '@/stores/gameStore';
import { CategorySelect } from '../CategorySelect';

// Mock the game store
const mockLoadProfiles = vi.fn();
const mockStartGame = vi.fn();
const mockLoadFromStorage = vi.fn().mockResolvedValue(true);
const mockGetState = vi.fn();

vi.mock('@/stores/gameStore', () => ({
  useGameStore: vi.fn(),
}));

// Mock window.location
const mockLocation = {
  href: '',
};
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

// Mock profiles data
const mockProfilesData = {
  version: '1',
  profiles: [
    {
      id: 'profile-1',
      category: 'Famous People',
      name: 'Albert Einstein',
      clues: ['Clue 1', 'Clue 2'],
      metadata: { language: 'en' },
    },
    {
      id: 'profile-2',
      category: 'Famous People',
      name: 'Leonardo da Vinci',
      clues: ['Clue 1', 'Clue 2'],
      metadata: { language: 'en' },
    },
    {
      id: 'profile-3',
      category: 'Countries',
      name: 'Japan',
      clues: ['Clue 1', 'Clue 2'],
      metadata: { language: 'en' },
    },
    {
      id: 'profile-4',
      category: 'Movies',
      name: 'The Matrix',
      clues: ['Clue 1', 'Clue 2'],
      metadata: { language: 'en' },
    },
  ],
};

// Create QueryClient for tests
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderWithProviders = (component: React.ReactElement) => {
  return render(<QueryClientProvider client={queryClient}>{component}</QueryClientProvider>);
};

describe('CategorySelect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.href = '';
    queryClient.clear();

    // Mock fetch for profiles data
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockProfilesData),
      })
    ) as unknown as typeof fetch;

    // Mock zustand store with getState support
    const useGameStoreMock = useGameStore as unknown as ReturnType<typeof vi.fn> & {
      getState: typeof mockGetState;
    };

    useGameStoreMock.mockImplementation(
      (
        selector: (state: {
          loadProfiles: typeof mockLoadProfiles;
          startGame: typeof mockStartGame;
          loadFromStorage: typeof mockLoadFromStorage;
        }) => unknown
      ) =>
        selector({
          loadProfiles: mockLoadProfiles,
          startGame: mockStartGame,
          loadFromStorage: mockLoadFromStorage,
        })
    );

    useGameStoreMock.getState = mockGetState.mockReturnValue({
      loadProfiles: mockLoadProfiles,
      startGame: mockStartGame,
      loadFromStorage: mockLoadFromStorage,
    });
  });

  describe('Initial Render', () => {
    it('should show loading state initially', async () => {
      renderWithProviders(<CategorySelect sessionId="test-session" />);

      expect(screen.getByText(/loading categories/i)).toBeInTheDocument();

      // Wait for async effects to settle
      await waitFor(() => {
        expect(mockLoadFromStorage).toHaveBeenCalledWith('test-session');
      });
    });

    it('should render category buttons after loading', async () => {
      renderWithProviders(<CategorySelect sessionId="test-session" />);

      await waitFor(() => {
        expect(screen.getByText('Famous People')).toBeInTheDocument();
      });

      expect(screen.getByText('Countries')).toBeInTheDocument();
      expect(screen.getByText('Movies')).toBeInTheDocument();
    });

    it('should render Shuffle All button', async () => {
      renderWithProviders(<CategorySelect sessionId="test-session" />);

      await waitFor(() => {
        expect(screen.getByText('Shuffle All')).toBeInTheDocument();
      });
    });

    it('should render OR divider', async () => {
      renderWithProviders(<CategorySelect sessionId="test-session" />);

      await waitFor(() => {
        expect(screen.getByText('or')).toBeInTheDocument();
      });
    });
  });

  describe('Category Selection', () => {
    it('should load profiles and start game when category is selected', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CategorySelect sessionId="test-session" />);

      await waitFor(() => {
        expect(screen.getByText('Famous People')).toBeInTheDocument();
      });

      const categoryButton = screen.getByText('Famous People');
      await user.click(categoryButton);

      expect(mockLoadProfiles).toHaveBeenCalledWith(mockProfilesData.profiles);
      expect(mockStartGame).toHaveBeenCalled();

      // Check that only Famous People profiles are included
      const startGameCall = mockStartGame.mock.calls[0][0];
      expect(startGameCall).toHaveLength(2); // 2 Famous People profiles
    });

    it('should navigate to game page after category selection', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CategorySelect sessionId="test-session" />);

      await waitFor(() => {
        expect(screen.getByText('Countries')).toBeInTheDocument();
      });

      const categoryButton = screen.getByText('Countries');
      await user.click(categoryButton);

      expect(mockLocation.href).toBe('/game/test-session');
    });

    it('should disable buttons after selection', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CategorySelect sessionId="test-session" />);

      await waitFor(() => {
        expect(screen.getByText('Movies')).toBeInTheDocument();
      });

      const categoryButton = screen.getByText('Movies');
      await user.click(categoryButton);

      // All buttons should be disabled
      expect(screen.getByText('Famous People')).toBeDisabled();
      expect(screen.getByText('Countries')).toBeDisabled();
      expect(screen.getByText('Movies')).toBeDisabled();
      expect(screen.getByText('Shuffle All')).toBeDisabled();
    });
  });

  describe('Shuffle All', () => {
    it('should load all profiles and start game when Shuffle All is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CategorySelect sessionId="test-session" />);

      await waitFor(() => {
        expect(screen.getByText('Shuffle All')).toBeInTheDocument();
      });

      const shuffleButton = screen.getByText('Shuffle All');
      await user.click(shuffleButton);

      expect(mockLoadProfiles).toHaveBeenCalledWith(mockProfilesData.profiles);
      expect(mockStartGame).toHaveBeenCalled();

      // Check that all profiles are included
      const startGameCall = mockStartGame.mock.calls[0][0];
      expect(startGameCall).toHaveLength(4); // All 4 profiles
    });

    it('should navigate to game page after Shuffle All', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CategorySelect sessionId="test-session" />);

      await waitFor(() => {
        expect(screen.getByText('Shuffle All')).toBeInTheDocument();
      });

      const shuffleButton = screen.getByText('Shuffle All');
      await user.click(shuffleButton);

      expect(mockLocation.href).toBe('/game/test-session');
    });
  });

  describe('Error Handling', () => {
    it('should show error state when profiles fail to load', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          statusText: 'Not Found',
        })
      ) as unknown as typeof fetch;

      renderWithProviders(<CategorySelect sessionId="test-session" />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Error' })).toBeInTheDocument();
      });

      expect(screen.getByText('Failed to load categories. Please try again.')).toBeInTheDocument();
    });
  });
});
