import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useGameStore } from '@/stores/gameStore';
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
        expect(screen.getByText('categorySelect.selectAll')).toBeInTheDocument();
      });

      expect(screen.getByText('categorySelect.deselectAll')).toBeInTheDocument();
    });

    it('should render Continue button disabled initially', async () => {
      renderWithProviders(<CategorySelect sessionId="test-session" />);

      await waitFor(() => {
        expect(screen.getByText('Famous People')).toBeInTheDocument();
      });

      const continueButton = screen.getByRole('button', { name: /common.continue/i });
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
      const continueButton = screen.getByRole('button', { name: /common.continue/i });
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
      const continueButton = screen.getByRole('button', { name: /common.continue/i });
      expect(continueButton).not.toBeDisabled();
    });

    it('should enable Continue button when categories are selected', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CategorySelect sessionId="test-session" />);

      await waitFor(() => {
        expect(screen.getByText('Famous People')).toBeInTheDocument();
      });

      const checkbox = screen.getByRole('checkbox', { name: /Famous People/i });
      const continueButton = screen.getByRole('button', { name: /common.continue/i });

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

      const continueButton = screen.getByRole('button', { name: /common.continue/i });
      await user.click(continueButton);

      // Should now show rounds screen
      await waitFor(() => {
        expect(screen.getByText('categorySelect.rounds.title')).toBeInTheDocument();
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

      const continueButton = screen.getByRole('button', { name: /common.continue/i });
      await user.click(continueButton);

      await waitFor(() => {
        expect(screen.getByText('categorySelect.rounds.title')).toBeInTheDocument();
      });

      const startButton = screen.getByText('categorySelect.rounds.startButton');
      await user.click(startButton);

      await waitFor(() => {
        expect(mockStartGame).toHaveBeenCalled();
      });

      const [categoriesArg, roundsArg] = mockStartGame.mock.calls[0];
      expect(categoriesArg).toEqual(
        expect.arrayContaining(['Famous People', 'Countries', 'Movies'])
      );
      expect(categoriesArg).toHaveLength(3);
      expect(roundsArg).toBe(5);
    });
  });

  describe('Select All / Deselect All', () => {
    it('should select all categories when Select All is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CategorySelect sessionId="test-session" />);

      await waitFor(() => {
        expect(screen.getByText('Famous People')).toBeInTheDocument();
      });

      const selectAllButton = screen.getByRole('button', { name: /categorySelect.selectAll/i });
      await user.click(selectAllButton);

      // All checkboxes should be checked
      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach((checkbox) => {
        expect(checkbox).toBeChecked();
      });

      // Continue button should be enabled
      const continueButton = screen.getByRole('button', { name: /common.continue/i });
      expect(continueButton).not.toBeDisabled();
    });

    it('should deselect all categories when Deselect All is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CategorySelect sessionId="test-session" />);

      await waitFor(() => {
        expect(screen.getByText('Famous People')).toBeInTheDocument();
      });

      const selectAllButton = screen.getByRole('button', { name: /categorySelect.selectAll/i });
      await user.click(selectAllButton);

      // All checkboxes should be checked
      await waitFor(() => {
        const checkboxes = screen.getAllByRole('checkbox');
        checkboxes.forEach((checkbox) => {
          expect(checkbox).toBeChecked();
        });
      });

      const deselectAllButton = screen.getByRole('button', { name: /categorySelect.deselectAll/i });
      await user.click(deselectAllButton);

      // All checkboxes should be unchecked
      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach((checkbox) => {
        expect(checkbox).not.toBeChecked();
      });

      // Continue button should be disabled
      const continueButton = screen.getByRole('button', { name: /common.continue/i });
      expect(continueButton).toBeDisabled();
    });

    it('should disable Select All when all are selected', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CategorySelect sessionId="test-session" />);

      await waitFor(() => {
        expect(screen.getByText('Famous People')).toBeInTheDocument();
      });

      const selectAllButton = screen.getByRole('button', { name: /categorySelect.selectAll/i });
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

      const deselectAllButton = screen.getByRole('button', { name: /categorySelect.deselectAll/i });
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

      const continueButton = screen.getByRole('button', { name: /common.continue/i });
      await user.click(continueButton);

      await waitFor(() => {
        expect(screen.getByText('categorySelect.rounds.title')).toBeInTheDocument();
        expect(screen.getByLabelText('categorySelect.rounds.label')).toBeInTheDocument();
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

      const continueButton = screen.getByRole('button', { name: /common.continue/i });
      await user.click(continueButton);

      await waitFor(() => {
        expect(screen.getByLabelText('categorySelect.rounds.label')).toBeInTheDocument();
      });

      const roundsInput = screen.getByLabelText('categorySelect.rounds.label') as HTMLInputElement;
      expect(roundsInput.value).toBe('5');
      expect(roundsInput.min).toBe('1');
      expect(roundsInput.max).toBe('50');
    });

    it('should allow going back to category selection', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CategorySelect sessionId="test-session" />);

      await waitFor(() => {
        expect(screen.getByText('Movies')).toBeInTheDocument();
      });

      const checkbox = screen.getByRole('checkbox', { name: /Movies/i });
      await user.click(checkbox);

      const continueButton = screen.getByRole('button', { name: /common.continue/i });
      await user.click(continueButton);

      await waitFor(() => {
        expect(screen.getByText('categorySelect.rounds.title')).toBeInTheDocument();
      });

      const backButton = screen.getByText('common.back');
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

      const continueButton = screen.getByRole('button', { name: /common.continue/i });
      await user.click(continueButton);

      await waitFor(() => {
        expect(screen.getByText('categorySelect.rounds.title')).toBeInTheDocument();
      });

      const startButton = screen.getByText('categorySelect.rounds.startButton');
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

      const continueButton = screen.getByRole('button', { name: /common.continue/i });
      await user.click(continueButton);

      await waitFor(() => {
        expect(screen.getByText('categorySelect.rounds.title')).toBeInTheDocument();
      });

      const startButton = screen.getByText('categorySelect.rounds.startButton');
      await user.click(startButton);

      await waitFor(() => {
        expect(mockForcePersist).toHaveBeenCalledTimes(1);
        expect(mockLocation.href).toBe('/game/test-session');
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

      const continueButton = screen.getByRole('button', { name: /common.continue/i });
      await user.click(continueButton);

      await waitFor(() => {
        expect(screen.getByText('categorySelect.rounds.title')).toBeInTheDocument();
      });

      const roundsInput = screen.getByLabelText('categorySelect.rounds.label') as HTMLInputElement;

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

      const checkbox = screen.getByRole('checkbox', { name: /Famous People/i });
      await user.click(checkbox);

      const continueButton = screen.getByRole('button', { name: /common.continue/i });
      await user.click(continueButton);

      await waitFor(() => {
        expect(screen.getByText('categorySelect.rounds.title')).toBeInTheDocument();
      });

      const roundsInput = screen.getByLabelText('categorySelect.rounds.label') as HTMLInputElement;

      // Clear the input
      await user.clear(roundsInput);
      expect(roundsInput.value).toBe('');

      // Type a new value
      await user.type(roundsInput, '10');

      // New value should be displayed
      expect(roundsInput.value).toBe('10');

      // Start button should be enabled
      const startButton = screen.getByText('categorySelect.rounds.startButton');
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

      const continueButton = screen.getByRole('button', { name: /common.continue/i });
      await user.click(continueButton);

      await waitFor(() => {
        expect(screen.getByText('categorySelect.rounds.title')).toBeInTheDocument();
      });

      const roundsInput = screen.getByLabelText('categorySelect.rounds.label') as HTMLInputElement;

      // Clear and type invalid value
      await user.clear(roundsInput);
      await user.type(roundsInput, '100');

      // Error should be shown
      await waitFor(() => {
        expect(screen.getByText(/Invalid value/i)).toBeInTheDocument();
      });

      // Start button should be disabled
      const startButton = screen.getByText('categorySelect.rounds.startButton');
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

      const continueButton = screen.getByRole('button', { name: /common.continue/i });
      await user.click(continueButton);

      await waitFor(() => {
        expect(screen.getByText('categorySelect.rounds.title')).toBeInTheDocument();
      });

      const roundsInput = screen.getByLabelText('categorySelect.rounds.label') as HTMLInputElement;
      const startButton = screen.getByText('categorySelect.rounds.startButton');

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

      const checkbox = screen.getByRole('checkbox', { name: /Famous People/i });
      await user.click(checkbox);

      const continueButton = screen.getByRole('button', { name: /common.continue/i });
      await user.click(continueButton);

      await waitFor(() => {
        expect(screen.getByText('categorySelect.rounds.title')).toBeInTheDocument();
      });

      const roundsInput = screen.getByLabelText('categorySelect.rounds.label') as HTMLInputElement;
      const startButton = screen.getByText('categorySelect.rounds.startButton');

      // Clear and type valid value
      await user.clear(roundsInput);
      await user.type(roundsInput, '20');

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
});
