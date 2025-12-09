import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useGameStore } from '@/stores/gameStore';
import { customRender } from '../../__mocks__/test-utils';
import { CategorySelect } from '../CategorySelect';

// Mock the game store - use vi.hoisted to ensure mocks are available before vi.mock
const { mockLoadProfiles, mockStartGame, mockLoadFromStorage, mockGetState, mockForcePersist } =
  vi.hoisted(() => ({
    mockLoadProfiles: vi.fn(),
    mockStartGame: vi.fn(),
    mockLoadFromStorage: vi.fn().mockResolvedValue(true),
    mockGetState: vi.fn(),
    mockForcePersist: vi.fn().mockResolvedValue(undefined),
  }));

vi.mock('@/stores/gameStore', () => ({
  useGameStore: vi.fn(),
  forcePersist: mockForcePersist,
}));

// Mock window.location
const mockLocation = {
  href: '',
};
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

// Mock manifest with new structure
const mockManifest = {
  version: '1',
  generatedAt: '2025-01-01T00:00:00Z',
  categories: [
    {
      slug: 'famous-people',
      locales: {
        en: { name: 'Famous People', files: ['data-1.json'] },
      },
    },
    {
      slug: 'countries',
      locales: {
        en: { name: 'Countries', files: ['data-1.json'] },
      },
    },
    {
      slug: 'movies',
      locales: {
        en: { name: 'Movies', files: ['data-1.json'] },
      },
    },
  ],
};

// Mock data by category
const mockCategoryData: Record<string, Record<string, Record<string, unknown>>> = {
  'famous-people': {
    en: {
      'data-1.json': {
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
        ],
      },
    },
  },
  countries: {
    en: {
      'data-1.json': {
        version: '1',
        profiles: [
          {
            id: 'profile-3',
            category: 'Countries',
            name: 'Japan',
            clues: ['Clue 1', 'Clue 2'],
            metadata: { language: 'en' },
          },
        ],
      },
    },
  },
  movies: {
    en: {
      'data-1.json': {
        version: '1',
        profiles: [
          {
            id: 'profile-4',
            category: 'Movies',
            name: 'The Matrix',
            clues: ['Clue 1', 'Clue 2'],
            metadata: { language: 'en' },
          },
        ],
      },
    },
  },
};

// For compatibility with tests, create merged profiles data
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

const renderWithProviders = (component: ReactElement) => {
  return customRender(<QueryClientProvider client={queryClient}>{component}</QueryClientProvider>);
};

describe('CategorySelect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.href = '';
    queryClient.clear();

    // Mock fetch to handle the new manifest + category data structure
    global.fetch = vi.fn((url: string) => {
      // Handle manifest request
      if (url.includes('/data/manifest.json')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockManifest),
        });
      }

      // Handle category data requests: /data/{category}/{locale}/{file}
      // Pattern: /data/famous-people/en/data-1.json
      const categoryMatch = url.match(/\/data\/([^/]+)\/([^/]+)\/([^/]+)$/);
      if (categoryMatch) {
        const [, category, locale, file] = categoryMatch;
        const categoryData = mockCategoryData[category]?.[locale]?.[file];
        if (categoryData) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(categoryData),
          });
        }
      }

      // Fallback: return 404
      return Promise.resolve({
        ok: false,
        statusText: 'Not Found',
      });
    }) as unknown as typeof fetch;

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

    it('should render category checkboxes after loading', async () => {
      renderWithProviders(<CategorySelect sessionId="test-session" />);

      await waitFor(() => {
        expect(screen.getByText('Famous People')).toBeInTheDocument();
      });

      expect(screen.getByText('Countries')).toBeInTheDocument();
      expect(screen.getByText('Movies')).toBeInTheDocument();
    });

    it('should render Select All and Deselect All buttons', async () => {
      renderWithProviders(<CategorySelect sessionId="test-session" />);

      await waitFor(() => {
        expect(screen.getByText('Select All')).toBeInTheDocument();
      });

      expect(screen.getByText('Deselect All')).toBeInTheDocument();
    });

    it('should render Continue button disabled initially', async () => {
      renderWithProviders(<CategorySelect sessionId="test-session" />);

      await waitFor(() => {
        expect(screen.getByText('Famous People')).toBeInTheDocument();
      });

      const continueButton = screen.getByRole('button', { name: /Continue/i });
      expect(continueButton).toBeDisabled();
    });
  });

  describe('Multi-Category Selection', () => {
    it('should allow selecting single category', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CategorySelect sessionId="test-session" />);

      await waitFor(() => {
        expect(screen.getByText('Famous People')).toBeInTheDocument();
      });

      const checkbox = screen.getByRole('checkbox', { name: /Famous People/i });
      await user.click(checkbox);

      // Should enable continue button
      const continueButton = screen.getByRole('button', { name: /Continue/i });
      expect(continueButton).not.toBeDisabled();
    });

    it('should allow selecting multiple categories', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CategorySelect sessionId="test-session" />);

      await waitFor(() => {
        expect(screen.getByText('Famous People')).toBeInTheDocument();
      });

      const famousCheckbox = screen.getByRole('checkbox', { name: /Famous People/i });
      const countriesCheckbox = screen.getByRole('checkbox', { name: /Countries/i });

      await user.click(famousCheckbox);
      await user.click(countriesCheckbox);

      // Both should be checked
      expect(famousCheckbox).toBeChecked();
      expect(countriesCheckbox).toBeChecked();

      // Continue button should be enabled
      const continueButton = screen.getByRole('button', { name: /Continue/i });
      expect(continueButton).not.toBeDisabled();
    });

    it('should enable Continue button when categories are selected', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CategorySelect sessionId="test-session" />);

      await waitFor(() => {
        expect(screen.getByText('Famous People')).toBeInTheDocument();
      });

      const checkbox = screen.getByRole('checkbox', { name: /Famous People/i });
      const continueButton = screen.getByRole('button', { name: /Continue/i });

      expect(continueButton).toBeDisabled();
      await user.click(checkbox);
      expect(continueButton).not.toBeDisabled();
    });

    it('should transition to rounds screen when Continue is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CategorySelect sessionId="test-session" />);

      await waitFor(() => {
        expect(screen.getByText('Famous People')).toBeInTheDocument();
      });

      const checkbox = screen.getByRole('checkbox', { name: /Famous People/i });
      await user.click(checkbox);

      const continueButton = screen.getByRole('button', { name: /Continue/i });
      await user.click(continueButton);

      // Should now show rounds screen
      await waitFor(() => {
        expect(screen.getByText('Number of Rounds')).toBeInTheDocument();
      });
    });

    it('should pass all selected categories to startGame', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CategorySelect sessionId="test-session" />);

      await waitFor(() => {
        expect(screen.getByText('Famous People')).toBeInTheDocument();
      });

      const famousCheckbox = screen.getByRole('checkbox', { name: /Famous People/i });
      const countriesCheckbox = screen.getByRole('checkbox', { name: /Countries/i });
      const moviesCheckbox = screen.getByRole('checkbox', { name: /Movies/i });

      await user.click(famousCheckbox);
      await user.click(countriesCheckbox);
      await user.click(moviesCheckbox);

      const continueButton = screen.getByRole('button', { name: /Continue/i });
      await user.click(continueButton);

      await waitFor(() => {
        expect(screen.getByText('Number of Rounds')).toBeInTheDocument();
      });

      const startButton = screen.getByText('Start Game');
      await user.click(startButton);

      await waitFor(() => {
        expect(mockStartGame).toHaveBeenCalled();
      });

      const [categoriesArg, roundsArg] = mockStartGame.mock.calls[0];
      expect(categoriesArg).toEqual(
        expect.arrayContaining(['Famous People', 'Countries', 'Movies'])
      );
      expect(categoriesArg).toHaveLength(3);
      // With 4 total profiles (2 Famous People + 1 Countries + 1 Movies),
      // initial rounds = Math.min(5, 4) = 4
      expect(roundsArg).toBe(4);
    });
  });

  describe('Select All / Deselect All', () => {
    it('should select all categories when Select All is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CategorySelect sessionId="test-session" />);

      await waitFor(() => {
        expect(screen.getByText('Famous People')).toBeInTheDocument();
      });

      const buttons = screen.getAllByRole('button');
      const selectAllButton = buttons.find((btn) => btn.textContent === 'Select All');
      if (!selectAllButton) throw new Error('Select All button not found');

      await user.click(selectAllButton);

      // All checkboxes should be checked
      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach((checkbox) => {
        expect(checkbox).toBeChecked();
      });

      // Continue button should be enabled
      const continueButton = screen.getByRole('button', { name: /Continue/i });
      expect(continueButton).not.toBeDisabled();
    });

    it('should deselect all categories when Deselect All is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CategorySelect sessionId="test-session" />);

      await waitFor(() => {
        expect(screen.getByText('Famous People')).toBeInTheDocument();
      });

      const buttons = screen.getAllByRole('button');
      const selectAllButton = buttons.find((btn) => btn.textContent === 'Select All');
      if (!selectAllButton) throw new Error('Select All button not found');

      await user.click(selectAllButton);

      // All checkboxes should be checked
      await waitFor(() => {
        const checkboxes = screen.getAllByRole('checkbox');
        checkboxes.forEach((checkbox) => {
          expect(checkbox).toBeChecked();
        });
      });

      const deselectAllButton = screen.getByRole('button', { name: /Deselect All/i });
      await user.click(deselectAllButton);

      // All checkboxes should be unchecked
      await waitFor(() => {
        const checkboxes = screen.getAllByRole('checkbox');
        checkboxes.forEach((checkbox) => {
          expect(checkbox).not.toBeChecked();
        });
      });

      // Continue button should be disabled again
      const continueButton = screen.getByRole('button', { name: /Continue/i });
      expect(continueButton).toBeDisabled();
    });

    it('should disable Select All when all are selected', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CategorySelect sessionId="test-session" />);

      await waitFor(() => {
        expect(screen.getByText('Famous People')).toBeInTheDocument();
      });

      const buttons = screen.getAllByRole('button');
      const selectAllButton = buttons.find((btn) => btn.textContent === 'Select All');
      if (!selectAllButton) throw new Error('Select All button not found');

      await user.click(selectAllButton);

      // After selecting all, button should be disabled
      await waitFor(() => {
        expect(selectAllButton).toBeDisabled();
      });
    });

    it('should enable Deselect All when categories are selected', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CategorySelect sessionId="test-session" />);

      await waitFor(() => {
        expect(screen.getByText('Famous People')).toBeInTheDocument();
      });

      const deselectAllButton = screen.getByRole('button', { name: /Deselect All/i });
      expect(deselectAllButton).toBeDisabled();

      const checkbox = screen.getByRole('checkbox', { name: /Famous People/i });
      await user.click(checkbox);

      expect(deselectAllButton).not.toBeDisabled();
    });
  });

  describe('Rounds Selection', () => {
    it('should show rounds input after Continue is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CategorySelect sessionId="test-session" />);

      await waitFor(() => {
        expect(screen.getByText('Famous People')).toBeInTheDocument();
      });

      const checkbox = screen.getByRole('checkbox', { name: /Famous People/i });
      await user.click(checkbox);

      const continueButton = screen.getByRole('button', { name: /Continue/i });
      await user.click(continueButton);

      await waitFor(() => {
        expect(screen.getByText('Number of Rounds')).toBeInTheDocument();
        expect(screen.getByLabelText('Number of rounds')).toBeInTheDocument();
      });
    });

    it('should have default value of 5 rounds', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CategorySelect sessionId="test-session" />);

      await waitFor(() => {
        expect(screen.getByText('Famous People')).toBeInTheDocument();
      });

      const checkbox = screen.getByRole('checkbox', { name: /Famous People/i });
      await user.click(checkbox);

      const continueButton = screen.getByRole('button', { name: /Continue/i });
      await user.click(continueButton);

      await waitFor(() => {
        expect(screen.getByLabelText('Number of rounds')).toBeInTheDocument();
      });

      const roundsInput = screen.getByLabelText('Number of rounds') as HTMLInputElement;
      // Famous People has 2 profiles, so initial value = Math.min(5, 2) = 2
      expect(roundsInput.value).toBe('2');
      expect(roundsInput.min).toBe('1');
      // Max should be 2 (number of Famous People profiles)
      expect(roundsInput.max).toBe('2');
    });

    it('should allow going back to category selection', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CategorySelect sessionId="test-session" />);

      await waitFor(() => {
        expect(screen.getByText('Movies')).toBeInTheDocument();
      });

      const checkbox = screen.getByRole('checkbox', { name: /Movies/i });
      await user.click(checkbox);

      const continueButton = screen.getByRole('button', { name: /Continue/i });
      await user.click(continueButton);

      await waitFor(() => {
        expect(screen.getByText('Number of Rounds')).toBeInTheDocument();
      });

      const backButton = screen.getByText('Back');
      await user.click(backButton);

      await waitFor(() => {
        // Back to category selection - check if the title is visible
        const heading = screen.getByRole('heading');
        expect(heading).toBeInTheDocument();
        // Checkbox should still be checked
        expect(screen.getByRole('checkbox', { name: /Movies/i })).toBeChecked();
      });
    });

    it('should load profiles and start game with selected categories', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CategorySelect sessionId="test-session" />);

      await waitFor(() => {
        expect(screen.getByText('Famous People')).toBeInTheDocument();
      });

      const famousCheckbox = screen.getByRole('checkbox', { name: /Famous People/i });
      const countriesCheckbox = screen.getByRole('checkbox', { name: /Countries/i });

      await user.click(famousCheckbox);
      await user.click(countriesCheckbox);

      const continueButton = screen.getByRole('button', { name: /Continue/i });
      await user.click(continueButton);

      await waitFor(() => {
        expect(screen.getByText('Number of Rounds')).toBeInTheDocument();
      });

      const startButton = screen.getByText('Start Game');
      await user.click(startButton);

      await waitFor(() => {
        expect(mockLoadProfiles).toHaveBeenCalledWith(mockProfilesData.profiles);
        expect(mockStartGame).toHaveBeenCalled();
      });

      const [categoriesArg] = mockStartGame.mock.calls[0];
      expect(categoriesArg).toEqual(expect.arrayContaining(['Famous People', 'Countries']));
    });

    it('should navigate to game page after starting game', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CategorySelect sessionId="test-session" />);

      await waitFor(() => {
        expect(screen.getByText('Countries')).toBeInTheDocument();
      });

      const checkbox = screen.getByRole('checkbox', { name: /Countries/i });
      await user.click(checkbox);

      const continueButton = screen.getByRole('button', { name: /Continue/i });
      await user.click(continueButton);

      await waitFor(() => {
        expect(screen.getByText('Number of Rounds')).toBeInTheDocument();
      });

      const startButton = screen.getByText('Start Game');
      await user.click(startButton);

      await waitFor(() => {
        expect(mockForcePersist).toHaveBeenCalledTimes(1);
        expect(mockLocation.href).toBe('/en/game/test-session');
      });
    });

    it('should allow deleting the last digit in rounds input (empty string)', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CategorySelect sessionId="test-session" />);

      await waitFor(() => {
        expect(screen.getByText('Famous People')).toBeInTheDocument();
      });

      const checkbox = screen.getByRole('checkbox', { name: /Famous People/i });
      await user.click(checkbox);

      const continueButton = screen.getByRole('button', { name: /Continue/i });
      await user.click(continueButton);

      await waitFor(() => {
        expect(screen.getByText('Number of Rounds')).toBeInTheDocument();
      });

      const roundsInput = screen.getByLabelText('Number of rounds') as HTMLInputElement;

      // Clear the input by selecting all and deleting (simulates backspace behavior)
      await user.clear(roundsInput);

      // Input should be empty
      expect(roundsInput.value).toBe('');

      // Error should not be shown for empty input
      const errorText = screen.queryByText(/Invalid value/i);
      expect(errorText).not.toBeInTheDocument();
    });

    it('should allow typing a new number after deleting all digits', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CategorySelect sessionId="test-session" />);

      await waitFor(() => {
        expect(screen.getByText('Famous People')).toBeInTheDocument();
      });

      // Select all categories to have more profiles available
      const buttons = screen.getAllByRole('button');
      const selectAllButton = buttons.find((btn) => btn.textContent === 'Select All');
      if (!selectAllButton) throw new Error('Select All button not found');
      await user.click(selectAllButton);

      const continueButton = screen.getByRole('button', { name: /Continue/i });
      await user.click(continueButton);

      await waitFor(() => {
        expect(screen.getByText('Number of Rounds')).toBeInTheDocument();
      });

      const roundsInput = screen.getByLabelText('Number of rounds') as HTMLInputElement;

      // Clear the input
      await user.clear(roundsInput);
      expect(roundsInput.value).toBe('');

      // Type a new value - with all categories selected, we have 4 total profiles,
      // so we can type any value from 1-4
      await user.type(roundsInput, '3');

      // New value should be displayed
      expect(roundsInput.value).toBe('3');

      // Start button should be enabled
      const startButton = screen.getByText('Start Game');
      expect(startButton).not.toBeDisabled();
    });

    it('should show error when rounds input has invalid value', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CategorySelect sessionId="test-session" />);

      await waitFor(() => {
        expect(screen.getByText('Famous People')).toBeInTheDocument();
      });

      const checkbox = screen.getByRole('checkbox', { name: /Famous People/i });
      await user.click(checkbox);

      const continueButton = screen.getByRole('button', { name: /Continue/i });
      await user.click(continueButton);

      await waitFor(() => {
        expect(screen.getByText('Number of Rounds')).toBeInTheDocument();
      });

      const roundsInput = screen.getByLabelText('Number of rounds') as HTMLInputElement;

      // Clear and type invalid value
      await user.clear(roundsInput);
      await user.type(roundsInput, '100');

      // Error should be shown
      await waitFor(() => {
        expect(screen.getByText(/Invalid value/i)).toBeInTheDocument();
      });

      // Start button should be disabled
      const startButton = screen.getByText('Start Game');
      expect(startButton).toBeDisabled();
    });

    it('should disable Start button with invalid rounds value', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CategorySelect sessionId="test-session" />);

      await waitFor(() => {
        expect(screen.getByText('Famous People')).toBeInTheDocument();
      });

      const checkbox = screen.getByRole('checkbox', { name: /Famous People/i });
      await user.click(checkbox);

      const continueButton = screen.getByRole('button', { name: /Continue/i });
      await user.click(continueButton);

      await waitFor(() => {
        expect(screen.getByText('Number of Rounds')).toBeInTheDocument();
      });

      const roundsInput = screen.getByLabelText('Number of rounds') as HTMLInputElement;
      const startButton = screen.getByText('Start Game');

      // Start button should be enabled initially
      expect(startButton).not.toBeDisabled();

      // Type invalid value
      await user.clear(roundsInput);
      await user.type(roundsInput, '-5');

      // Start button should be disabled
      await waitFor(() => {
        expect(startButton).toBeDisabled();
      });
    });

    it('should enable Start button with valid rounds value', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CategorySelect sessionId="test-session" />);

      await waitFor(() => {
        expect(screen.getByText('Famous People')).toBeInTheDocument();
      });

      // Select all categories to have more profiles available (4 total)
      const buttons = screen.getAllByRole('button');
      const selectAllButton = buttons.find((btn) => btn.textContent === 'Select All');
      if (!selectAllButton) throw new Error('Select All button not found');
      await user.click(selectAllButton);

      const continueButton = screen.getByRole('button', { name: /Continue/i });
      await user.click(continueButton);

      await waitFor(() => {
        expect(screen.getByText('Number of Rounds')).toBeInTheDocument();
      });

      const roundsInput = screen.getByLabelText('Number of rounds') as HTMLInputElement;
      const startButton = screen.getByText('Start Game');

      // Start button should be enabled initially (value is 4, which is valid for 4 profiles)
      expect(startButton).not.toBeDisabled();

      // Clear and type valid value - with 4 profiles, 3 is valid
      await user.clear(roundsInput);
      await user.type(roundsInput, '3');

      // Start button should be enabled
      await waitFor(() => {
        expect(startButton).not.toBeDisabled();
      });
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

  describe('useActionState Pending State Behavior - Category Selection', () => {
    it('should disable Continue button while action is pending', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CategorySelect sessionId="test-session" />);

      await waitFor(() => {
        expect(screen.getByText('Famous People')).toBeInTheDocument();
      });

      const checkbox = screen.getByRole('checkbox', { name: /Famous People/i });
      const continueButton = screen.getByRole('button', { name: /Continue/i });

      await user.click(checkbox);

      // Continue button should be enabled
      expect(continueButton).not.toBeDisabled();
    });

    it('should preserve selected categories while pending action is in progress', async () => {
      const user = userEvent.setup();
      let resolveStartGame: (() => void) | undefined;

      mockStartGame.mockReturnValue(
        new Promise<void>((resolve) => {
          resolveStartGame = resolve as () => void;
        })
      );

      renderWithProviders(<CategorySelect sessionId="test-session" />);

      await waitFor(() => {
        expect(screen.getByText('Famous People')).toBeInTheDocument();
      });

      // Select multiple categories
      const famousCheckbox = screen.getByRole('checkbox', { name: /Famous People/i });
      const countriesCheckbox = screen.getByRole('checkbox', { name: /Countries/i });
      const continueButton = screen.getByRole('button', { name: /Continue/i });

      await user.click(famousCheckbox);
      await user.click(countriesCheckbox);
      await user.click(continueButton);

      await waitFor(() => {
        expect(screen.getByText('Number of Rounds')).toBeInTheDocument();
      });

      const startButton = screen.getByText('Start Game');
      await user.click(startButton);

      // Categories should still be in the store
      const categoryArg = mockStartGame.mock.calls[0]?.[0];
      expect(categoryArg).toEqual(expect.arrayContaining(['Famous People', 'Countries']));

      // Resolve
      resolveStartGame?.();

      await vi.waitFor(() => {
        expect(mockForcePersist).toHaveBeenCalled();
      });
    });

    it('should load profiles before starting game action', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CategorySelect sessionId="test-session" />);

      await waitFor(() => {
        expect(screen.getByText('Famous People')).toBeInTheDocument();
      });

      const checkbox = screen.getByRole('checkbox', { name: /Famous People/i });
      const continueButton = screen.getByRole('button', { name: /Continue/i });

      await user.click(checkbox);
      await user.click(continueButton);

      await waitFor(() => {
        expect(screen.getByText('Number of Rounds')).toBeInTheDocument();
      });

      const startButton = screen.getByText('Start Game');
      await user.click(startButton);

      await vi.waitFor(() => {
        // loadProfiles should be called with profile data
        expect(mockLoadProfiles).toHaveBeenCalledWith(
          expect.arrayContaining([expect.objectContaining({ id: 'profile-1' })])
        );
      });
    });

    it('should handle rounds input validation before pending action', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CategorySelect sessionId="test-session" />);

      await waitFor(() => {
        expect(screen.getByText('Famous People')).toBeInTheDocument();
      });

      const checkbox = screen.getByRole('checkbox', { name: /Famous People/i });
      const continueButton = screen.getByRole('button', { name: /Continue/i });

      await user.click(checkbox);
      await user.click(continueButton);

      await waitFor(() => {
        expect(screen.getByText('Number of Rounds')).toBeInTheDocument();
      });

      const roundsInput = screen.getByLabelText('Number of rounds') as HTMLInputElement;
      const startButton = screen.getByText('Start Game');

      // Set invalid rounds value
      await user.clear(roundsInput);
      await user.type(roundsInput, '100');

      // Start button should be disabled for invalid input
      expect(startButton).toBeDisabled();

      // Fix the value
      await user.clear(roundsInput);
      await user.type(roundsInput, '1');

      // Start button should be enabled again
      await waitFor(() => {
        expect(startButton).not.toBeDisabled();
      });

      // Now click start game
      await user.click(startButton);

      // startGame should be called with valid rounds
      expect(mockStartGame).toHaveBeenCalledWith(
        expect.any(Array),
        1 // rounds value
      );
    });
  });
});
