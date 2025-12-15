import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { customRender } from '../../__mocks__/test-utils';
import { CategorySelect } from '../CategorySelect';

// Use vi.hoisted to declare mocks before vi.mock is called
const {
  mockUseCategoriesFromManifest,
  mockStartGame,
  mockLoadFromStorage,
  mockSetError,
  mockForcePersist,
} = vi.hoisted(() => ({
  mockUseCategoriesFromManifest: vi.fn(),
  mockStartGame: vi.fn(),
  mockLoadFromStorage: vi.fn().mockResolvedValue(true),
  mockSetError: vi.fn(),
  mockForcePersist: vi.fn().mockResolvedValue(undefined),
}));

// Mock the useCategoriesFromManifest hook
vi.mock('@/hooks/useCategoriesFromManifest', () => ({
  useCategoriesFromManifest: mockUseCategoriesFromManifest,
}));

// Mock the game store
vi.mock('@/stores/gameStore', () => ({
  useGameStore: vi.fn(),
  forcePersist: mockForcePersist,
}));

// Mock navigateWithLocale
vi.mock('@/i18n/locales', () => ({
  navigateWithLocale: vi.fn(),
}));

// Import after mocks are defined
import { useGameStore } from '@/stores/gameStore';

// Mock window.location
const mockLocation = {
  href: '',
  pathname: '/en/profile-selection',
};
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

// Mock categories data from useCategoriesFromManifest hook
const mockCategoriesData = [
  {
    slug: 'famous-people',
    name: 'Famous People',
    profileAmount: 2,
  },
  {
    slug: 'countries',
    name: 'Countries',
    profileAmount: 1,
  },
  {
    slug: 'movies',
    name: 'Movies',
    profileAmount: 1,
  },
];

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
    mockLocation.pathname = '/en/profile-selection';
    queryClient.clear();

    // Mock useCategoriesFromManifest to return data successfully
    mockUseCategoriesFromManifest.mockReturnValue({
      data: mockCategoriesData,
      isLoading: false,
      error: null,
    });

    // Mock useGameStore selector
    const useGameStoreMock = useGameStore as unknown as ReturnType<typeof vi.fn>;
    useGameStoreMock.mockImplementation(
      (
        selector: (state: {
          startGame: typeof mockStartGame;
          loadFromStorage: typeof mockLoadFromStorage;
          setError: typeof mockSetError;
        }) => unknown
      ) =>
        selector({
          startGame: mockStartGame,
          loadFromStorage: mockLoadFromStorage,
          setError: mockSetError,
        })
    );

    // Mock startGame to be async
    mockStartGame.mockResolvedValue(undefined);
    mockLoadFromStorage.mockResolvedValue(true);
  });

  describe('Initial Render', () => {
    it('should show loading state initially', async () => {
      mockUseCategoriesFromManifest.mockReturnValueOnce({
        data: undefined,
        isLoading: true,
        error: null,
      });

      renderWithProviders(<CategorySelect sessionId="test-session" />);

      // Check for ProfileLoadingSkeleton with animate-pulse class indicating loading state
      const skeletons = screen
        .getAllByRole('generic')
        .filter((el) => el.className.includes('animate-pulse'));
      expect(skeletons.length).toBeGreaterThan(0);
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

      const [categoriesArg, roundsArg, localeArg] = mockStartGame.mock.calls[0];
      expect(categoriesArg).toEqual(
        expect.arrayContaining(['famous-people', 'countries', 'movies'])
      );
      expect(categoriesArg).toHaveLength(3);
      expect(roundsArg).toBe(4); // min(5, 4 total profiles)
      expect(localeArg).toBe('en'); // Extracted from pathname
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

    it('should have default value based on selected categories', async () => {
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

    it('should start game with selected categories and rounds', async () => {
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
        expect(mockStartGame).toHaveBeenCalled();
      });

      const [categoriesArg, roundsArg] = mockStartGame.mock.calls[0];
      expect(categoriesArg).toEqual(expect.arrayContaining(['famous-people', 'countries']));
      expect(roundsArg).toBe(3); // min(5, 3 total profiles from 2 categories)
    });

    it('should navigate to game page after starting game', async () => {
      const { navigateWithLocale } = await import('@/i18n/locales');

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
        expect(navigateWithLocale).toHaveBeenCalledWith('/game/test-session');
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
    it('should show error state when categories fail to load', async () => {
      mockUseCategoriesFromManifest.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed to load categories'),
      });

      renderWithProviders(<CategorySelect sessionId="test-session" />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Error/i })).toBeInTheDocument();
      });

      expect(screen.getByText('Failed to load categories. Please try again.')).toBeInTheDocument();
    });
  });
});
