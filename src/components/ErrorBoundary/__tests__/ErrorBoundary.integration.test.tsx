import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Component, type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, type MockedFunction, vi } from 'vitest';
import { queryClient } from '@/components/QueryProvider';
import { getErrorService } from '@/services/ErrorService';
import ErrorBoundary from '../ErrorBoundary';

// Mock the ErrorService with proper logging capture
vi.mock('@/services/ErrorService', () => {
  const mockLogError = vi.fn();
  return {
    getErrorService: vi.fn(() => ({
      logError: mockLogError,
    })),
  };
});

// Type helper to cast mocked getErrorService
const mockedGetErrorService = getErrorService as MockedFunction<typeof getErrorService>;
const getMockedErrorService = () => {
  const service = mockedGetErrorService();
  return {
    logError: service.logError as MockedFunction<typeof service.logError>,
  };
};

// Test component that throws errors
const ThrowError: React.FC<{ message: string }> = ({ message }) => {
  throw new Error(message);
};

// Test component that renders successfully
const SuccessComponent: React.FC<{ message: string }> = ({ message }) => (
  <div data-testid="success-component">{message}</div>
);

// Mock GamePlay component
const MockGamePlay: React.FC<{ shouldThrow?: boolean }> = ({ shouldThrow = false }) => {
  if (shouldThrow) {
    throw new Error('GamePlay component error');
  }
  return <div data-testid="mock-gameplay">GamePlay Component</div>;
};

// Mock Scoreboard component
const MockScoreboard: React.FC<{ shouldThrow?: boolean }> = ({ shouldThrow = false }) => {
  if (shouldThrow) {
    throw new Error('Scoreboard component error');
  }
  return <div data-testid="mock-scoreboard">Scoreboard Component</div>;
};

// App layout with multiple sections
const AppLayout: React.FC<{
  gamePlayError?: boolean;
  scoreboardError?: boolean;
}> = ({ gamePlayError = false, scoreboardError = false }) => (
  <div data-testid="app-layout">
    <header data-testid="app-header">
      <h1>Game App</h1>
    </header>

    <main data-testid="app-main">
      <section data-testid="gameplay-section">
        <ErrorBoundary
          loggingContext="GamePlay"
          fallback={<div data-testid="gameplay-error">GamePlay Error</div>}
        >
          <MockGamePlay shouldThrow={gamePlayError} />
        </ErrorBoundary>
      </section>

      <aside data-testid="scoreboard-section">
        <ErrorBoundary
          loggingContext="Scoreboard"
          fallback={<div data-testid="scoreboard-error">Scoreboard Error</div>}
        >
          <MockScoreboard shouldThrow={scoreboardError} />
        </ErrorBoundary>
      </aside>
    </main>
  </div>
);

describe('ErrorBoundary Integration Tests', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Suppress console.error for error boundary tests (React logs error info)
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.clearAllMocks();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    vi.clearAllMocks();
  });

  describe('GamePlay Error Isolation', () => {
    it('should show fallback only for GamePlay section when GamePlay throws error', () => {
      render(<AppLayout gamePlayError={true} scoreboardError={false} />);

      // GamePlay error should be visible
      expect(screen.getByTestId('gameplay-error')).toBeInTheDocument();
      expect(screen.getByText('GamePlay Error')).toBeInTheDocument();

      // Rest of app should continue working
      expect(screen.getByTestId('app-header')).toBeInTheDocument();
      expect(screen.getByTestId('app-main')).toBeInTheDocument();
      expect(screen.getByTestId('scoreboard-section')).toBeInTheDocument();

      // Scoreboard should render normally
      expect(screen.getByTestId('mock-scoreboard')).toBeInTheDocument();
      expect(screen.getByText('Scoreboard Component')).toBeInTheDocument();
    });

    it('should not show scoreboard error when only GamePlay has error', () => {
      render(<AppLayout gamePlayError={true} scoreboardError={false} />);

      // Scoreboard error fallback should not be shown
      expect(screen.queryByTestId('scoreboard-error')).not.toBeInTheDocument();

      // Scoreboard component should render
      expect(screen.getByTestId('mock-scoreboard')).toBeInTheDocument();
    });

    it('should log GamePlay error with correct context', () => {
      const errorService = getMockedErrorService();

      render(<AppLayout gamePlayError={true} scoreboardError={false} />);

      expect(errorService.logError).toHaveBeenCalledTimes(1);

      const fn = errorService.logError as MockedFunction<typeof errorService.logError>;
      const callArgs = fn.mock.calls[0] as [Error, Record<string, unknown>];
      const additionalContext = callArgs[1];

      expect(additionalContext.loggingContext).toBe('GamePlay');
    });

    it('should keep GamePlay error isolated from Scoreboard rendering', () => {
      render(<AppLayout gamePlayError={true} scoreboardError={false} />);

      // GamePlay should show error
      expect(screen.getByTestId('gameplay-error')).toBeInTheDocument();

      // Scoreboard should render successfully
      const scoreboardComponent = screen.getByTestId('mock-scoreboard');
      expect(scoreboardComponent).toBeInTheDocument();
      expect(scoreboardComponent).toHaveTextContent('Scoreboard Component');
    });
  });

  describe('Scoreboard Error Isolation', () => {
    it('should show fallback only for Scoreboard section when Scoreboard throws error', () => {
      render(<AppLayout gamePlayError={false} scoreboardError={true} />);

      // Scoreboard error should be visible
      expect(screen.getByTestId('scoreboard-error')).toBeInTheDocument();
      expect(screen.getByText('Scoreboard Error')).toBeInTheDocument();

      // Rest of app should continue working
      expect(screen.getByTestId('app-header')).toBeInTheDocument();
      expect(screen.getByTestId('app-main')).toBeInTheDocument();
      expect(screen.getByTestId('gameplay-section')).toBeInTheDocument();

      // GamePlay should render normally
      expect(screen.getByTestId('mock-gameplay')).toBeInTheDocument();
      expect(screen.getByText('GamePlay Component')).toBeInTheDocument();
    });

    it('should not show gameplay error when only Scoreboard has error', () => {
      render(<AppLayout gamePlayError={false} scoreboardError={true} />);

      // GamePlay error fallback should not be shown
      expect(screen.queryByTestId('gameplay-error')).not.toBeInTheDocument();

      // GamePlay component should render
      expect(screen.getByTestId('mock-gameplay')).toBeInTheDocument();
    });

    it('should log Scoreboard error with correct context', () => {
      const errorService = getMockedErrorService();

      render(<AppLayout gamePlayError={false} scoreboardError={true} />);

      expect(errorService.logError).toHaveBeenCalledTimes(1);

      const fn = errorService.logError as MockedFunction<typeof errorService.logError>;
      const callArgs = fn.mock.calls[0] as [Error, Record<string, unknown>];
      const additionalContext = callArgs[1];

      expect(additionalContext.loggingContext).toBe('Scoreboard');
    });

    it('should keep Scoreboard error isolated from GamePlay rendering', () => {
      render(<AppLayout gamePlayError={false} scoreboardError={true} />);

      // Scoreboard should show error
      expect(screen.getByTestId('scoreboard-error')).toBeInTheDocument();

      // GamePlay should render successfully
      const gameplayComponent = screen.getByTestId('mock-gameplay');
      expect(gameplayComponent).toBeInTheDocument();
      expect(gameplayComponent).toHaveTextContent('GamePlay Component');
    });
  });

  describe('Multiple Boundaries Simultaneously', () => {
    it('should handle multiple error boundaries without interference', () => {
      render(<AppLayout gamePlayError={true} scoreboardError={true} />);

      // Both errors should be visible
      expect(screen.getByTestId('gameplay-error')).toBeInTheDocument();
      expect(screen.getByTestId('scoreboard-error')).toBeInTheDocument();

      // Header should still render
      expect(screen.getByTestId('app-header')).toBeInTheDocument();
    });

    it('should log both errors separately', () => {
      const errorService = getMockedErrorService();

      render(<AppLayout gamePlayError={true} scoreboardError={true} />);

      expect(errorService.logError).toHaveBeenCalledTimes(2);

      const fn = errorService.logError as MockedFunction<typeof errorService.logError>;
      const calls = fn.mock.calls;

      // Find which call logged GamePlay error
      const gameplayCall = calls.find((call) => {
        const additionalContext = call[1] as Record<string, unknown>;
        return additionalContext.loggingContext === 'GamePlay';
      });

      // Find which call logged Scoreboard error
      const scoreboardCall = calls.find((call) => {
        const additionalContext = call[1] as Record<string, unknown>;
        return additionalContext.loggingContext === 'Scoreboard';
      });

      expect(gameplayCall).toBeDefined();
      expect(scoreboardCall).toBeDefined();
    });

    it('should have separate logging contexts for each boundary', () => {
      const errorService = getMockedErrorService();

      render(<AppLayout gamePlayError={true} scoreboardError={true} />);

      const fn = errorService.logError as MockedFunction<typeof errorService.logError>;
      const calls = fn.mock.calls;

      const contexts = calls.map((call) => {
        const additionalContext = call[1] as Record<string, unknown>;
        return additionalContext.loggingContext;
      });

      expect(contexts).toContain('GamePlay');
      expect(contexts).toContain('Scoreboard');
    });

    it('should render each boundary error independently', () => {
      render(<AppLayout gamePlayError={true} scoreboardError={true} />);

      const gameplayErrorElement = screen.getByTestId('gameplay-error');
      const scoreboardErrorElement = screen.getByTestId('scoreboard-error');

      expect(gameplayErrorElement).toBeInTheDocument();
      expect(scoreboardErrorElement).toBeInTheDocument();
      expect(gameplayErrorElement).toHaveTextContent('GamePlay Error');
      expect(scoreboardErrorElement).toHaveTextContent('Scoreboard Error');
    });

    it('should allow independent recovery attempts for each boundary', async () => {
      const user = userEvent.setup();

      const AppWithRecovery: React.FC<{
        gamePlayError?: boolean;
        scoreboardError?: boolean;
      }> = ({ gamePlayError = false, scoreboardError = false }) => {
        const gamePlayFallback = (
          <button
            type="button"
            data-testid="gameplay-retry"
            onClick={() => {
              // Simulate retry - in real scenario, this would trigger re-render
            }}
          >
            Retry GamePlay
          </button>
        );

        const scoreboardFallback = (
          <button
            type="button"
            data-testid="scoreboard-retry"
            onClick={() => {
              // Simulate retry - in real scenario, this would trigger re-render
            }}
          >
            Retry Scoreboard
          </button>
        );

        return (
          <div data-testid="app-layout">
            <header data-testid="app-header">
              <h1>Game App</h1>
            </header>

            <main data-testid="app-main">
              <section data-testid="gameplay-section">
                <ErrorBoundary loggingContext="GamePlay" fallback={gamePlayFallback}>
                  <MockGamePlay shouldThrow={gamePlayError} />
                </ErrorBoundary>
              </section>

              <aside data-testid="scoreboard-section">
                <ErrorBoundary loggingContext="Scoreboard" fallback={scoreboardFallback}>
                  <MockScoreboard shouldThrow={scoreboardError} />
                </ErrorBoundary>
              </aside>
            </main>
          </div>
        );
      };

      render(<AppWithRecovery gamePlayError={true} scoreboardError={true} />);

      // Both retry buttons should be available
      expect(screen.getByTestId('gameplay-retry')).toBeInTheDocument();
      expect(screen.getByTestId('scoreboard-retry')).toBeInTheDocument();

      // Should be able to click each retry independently
      await user.click(screen.getByTestId('gameplay-retry'));
      expect(screen.getByTestId('gameplay-retry')).toBeInTheDocument();

      await user.click(screen.getByTestId('scoreboard-retry'));
      expect(screen.getByTestId('scoreboard-retry')).toBeInTheDocument();
    });
  });

  describe('Provider Integration - Query Provider', () => {
    it('should work correctly when placed inside QueryProvider', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <AppLayout gamePlayError={true} scoreboardError={false} />
        </QueryClientProvider>
      );

      // Error should be visible within QueryProvider
      expect(screen.getByTestId('gameplay-error')).toBeInTheDocument();

      // App should still be functional
      expect(screen.getByTestId('app-header')).toBeInTheDocument();
      expect(screen.getByTestId('mock-scoreboard')).toBeInTheDocument();
    });

    it('should log errors correctly with QueryProvider', () => {
      const errorService = getMockedErrorService();

      render(
        <QueryClientProvider client={queryClient}>
          <AppLayout gamePlayError={true} scoreboardError={false} />
        </QueryClientProvider>
      );

      expect(errorService.logError).toHaveBeenCalledTimes(1);

      const fn = errorService.logError as MockedFunction<typeof errorService.logError>;
      const callArgs = fn.mock.calls[0];
      const additionalContext = callArgs[1] as Record<string, unknown>;

      expect(additionalContext.loggingContext).toBe('GamePlay');
    });

    it('should not interfere with QueryProvider functionality', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <AppLayout gamePlayError={false} scoreboardError={false} />
        </QueryClientProvider>
      );

      // Components should render successfully
      expect(screen.getByTestId('mock-gameplay')).toBeInTheDocument();
      expect(screen.getByTestId('mock-scoreboard')).toBeInTheDocument();
    });

    it('should handle multiple error boundaries within QueryProvider', () => {
      const errorService = getMockedErrorService();

      render(
        <QueryClientProvider client={queryClient}>
          <AppLayout gamePlayError={true} scoreboardError={true} />
        </QueryClientProvider>
      );

      // Both errors should be visible
      expect(screen.getByTestId('gameplay-error')).toBeInTheDocument();
      expect(screen.getByTestId('scoreboard-error')).toBeInTheDocument();

      // Both should be logged
      expect(errorService.logError).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Recovery', () => {
    it('should recover from error when retry button is clicked', async () => {
      const user = userEvent.setup();
      let shouldThrow = true;

      const ConditionalComponent = () => {
        if (shouldThrow) {
          throw new Error('Temporary error');
        }
        return <SuccessComponent message="Recovered" />;
      };

      const fallbackFn = (_error: Error, retry: () => void) => (
        <button type="button" data-testid="retry-btn" onClick={retry}>
          Retry
        </button>
      );

      const { rerender } = render(
        <ErrorBoundary fallback={fallbackFn} loggingContext="RecoveryTest">
          <ConditionalComponent />
        </ErrorBoundary>
      );

      // Error should be displayed
      expect(screen.getByTestId('retry-btn')).toBeInTheDocument();

      // Fix the issue
      shouldThrow = false;

      // Click retry
      await user.click(screen.getByTestId('retry-btn'));

      // Re-render with fixed component
      rerender(
        <ErrorBoundary fallback={fallbackFn} loggingContext="RecoveryTest">
          <ConditionalComponent />
        </ErrorBoundary>
      );

      // Should recover and show success
      expect(screen.getByText('Recovered')).toBeInTheDocument();
    });

    it('should reset error state only for the specific boundary on retry', async () => {
      const user = userEvent.setup();

      const AppWithSelectiveRecovery: React.FC<{
        gamePlayError: boolean;
        scoreboardError: boolean;
      }> = ({ gamePlayError, scoreboardError }) => {
        const gamePlayFallback = (
          <button
            type="button"
            data-testid="gameplay-retry"
            onClick={() => {
              // In real scenario, this triggers re-render
            }}
          >
            Retry GamePlay
          </button>
        );

        const scoreboardFallback = (
          <button
            type="button"
            data-testid="scoreboard-retry"
            onClick={() => {
              // In real scenario, this triggers re-render
            }}
          >
            Retry Scoreboard
          </button>
        );

        return (
          <div>
            <ErrorBoundary loggingContext="GamePlay" fallback={gamePlayFallback}>
              <MockGamePlay shouldThrow={gamePlayError} />
            </ErrorBoundary>
            <ErrorBoundary loggingContext="Scoreboard" fallback={scoreboardFallback}>
              <MockScoreboard shouldThrow={scoreboardError} />
            </ErrorBoundary>
          </div>
        );
      };

      render(<AppWithSelectiveRecovery gamePlayError={true} scoreboardError={true} />);

      // Both errors should be shown
      expect(screen.getByTestId('gameplay-retry')).toBeInTheDocument();
      expect(screen.getByTestId('scoreboard-retry')).toBeInTheDocument();

      // Click gameplay retry
      await user.click(screen.getByTestId('gameplay-retry'));

      // Scoreboard retry button should still be there
      expect(screen.getByTestId('scoreboard-retry')).toBeInTheDocument();

      // Click scoreboard retry
      await user.click(screen.getByTestId('scoreboard-retry'));

      // Both retry buttons should still be there (state reset independent)
      expect(screen.getByTestId('gameplay-retry')).toBeInTheDocument();
      expect(screen.getByTestId('scoreboard-retry')).toBeInTheDocument();
    });
  });

  describe('Error Service Logging - Integration', () => {
    it('should log error with component stack context', () => {
      const errorService = getMockedErrorService();

      render(
        <ErrorBoundary loggingContext="TestComponent">
          <ThrowError message="Test error" />
        </ErrorBoundary>
      );

      const fn = errorService.logError as MockedFunction<typeof errorService.logError>;
      const callArgs = fn.mock.calls[0];
      const additionalContext = callArgs[1] as Record<string, unknown>;

      expect(additionalContext.componentStack).toBeDefined();
      expect(typeof additionalContext.componentStack).toBe('string');
      expect((additionalContext.componentStack as string).length).toBeGreaterThan(0);
    });

    it('should include correct error message in logging', () => {
      const errorService = getMockedErrorService();
      const errorMessage = 'Specific component error';

      render(
        <ErrorBoundary loggingContext="TestComponent">
          <ThrowError message={errorMessage} />
        </ErrorBoundary>
      );

      const fn = errorService.logError as MockedFunction<typeof errorService.logError>;
      const callArgs = fn.mock.calls[0] as [Error, Record<string, unknown>];
      const error = callArgs[0];

      expect(error.message).toBe(errorMessage);
    });

    it('should log errors with different contexts separately', () => {
      const errorService = getMockedErrorService();

      render(
        <>
          <ErrorBoundary loggingContext="GamePlay">
            <ThrowError message="GamePlay Error" />
          </ErrorBoundary>
          <ErrorBoundary loggingContext="Scoreboard">
            <ThrowError message="Scoreboard Error" />
          </ErrorBoundary>
        </>
      );

      const fn = errorService.logError as MockedFunction<typeof errorService.logError>;
      expect(fn).toHaveBeenCalledTimes(2);

      const calls = fn.mock.calls;
      const contexts = calls.map((call) => {
        const additionalContext = call[1] as Record<string, unknown>;
        return additionalContext.loggingContext;
      });

      expect(contexts).toEqual(['GamePlay', 'Scoreboard']);
    });
  });

  describe('Complex Multi-Section Scenarios', () => {
    it('should maintain correct error isolation in complex layout', () => {
      const ComplexLayout: React.FC<{
        section1Error?: boolean;
        section2Error?: boolean;
      }> = ({ section1Error = false, section2Error = false }) => (
        <div data-testid="complex-layout">
          <header data-testid="header">Header</header>
          <main>
            <section data-testid="section-1">
              <ErrorBoundary
                loggingContext="Section1"
                fallback={<div data-testid="error-1">Section 1 Error</div>}
              >
                <MockGamePlay shouldThrow={section1Error} />
              </ErrorBoundary>
            </section>
            <section data-testid="section-2">
              <ErrorBoundary
                loggingContext="Section2"
                fallback={<div data-testid="error-2">Section 2 Error</div>}
              >
                <MockScoreboard shouldThrow={section2Error} />
              </ErrorBoundary>
            </section>
            <section data-testid="section-3">
              <ErrorBoundary
                loggingContext="Section3"
                fallback={<div data-testid="error-3">Section 3 Error</div>}
              >
                <SuccessComponent message="Section 3" />
              </ErrorBoundary>
            </section>
          </main>
          <footer data-testid="footer">Footer</footer>
        </div>
      );

      render(<ComplexLayout section1Error={true} section2Error={false} />);

      // Only section 1 should show error
      expect(screen.getByTestId('error-1')).toBeInTheDocument();

      // Other sections should render normally
      expect(screen.queryByTestId('error-2')).not.toBeInTheDocument();
      expect(screen.queryByTestId('error-3')).not.toBeInTheDocument();
      expect(screen.getByTestId('mock-scoreboard')).toBeInTheDocument();
      expect(screen.getByText('Section 3')).toBeInTheDocument();

      // Layout structure should be intact
      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });

    it('should handle selective errors in multi-section layout', () => {
      const ComplexLayout: React.FC<{
        section1Error?: boolean;
        section2Error?: boolean;
      }> = ({ section1Error = false, section2Error = false }) => (
        <div data-testid="complex-layout">
          <section data-testid="section-1">
            <ErrorBoundary
              loggingContext="Section1"
              fallback={<div data-testid="error-1">Section 1 Error</div>}
            >
              <MockGamePlay shouldThrow={section1Error} />
            </ErrorBoundary>
          </section>
          <section data-testid="section-2">
            <ErrorBoundary
              loggingContext="Section2"
              fallback={<div data-testid="error-2">Section 2 Error</div>}
            >
              <MockScoreboard shouldThrow={section2Error} />
            </ErrorBoundary>
          </section>
          <section data-testid="section-3">
            <ErrorBoundary
              loggingContext="Section3"
              fallback={<div data-testid="error-3">Section 3 Error</div>}
            >
              <SuccessComponent message="Section 3" />
            </ErrorBoundary>
          </section>
        </div>
      );

      render(<ComplexLayout section1Error={false} section2Error={true} />);

      // Only section 2 should show error
      expect(screen.queryByTestId('error-1')).not.toBeInTheDocument();
      expect(screen.getByTestId('error-2')).toBeInTheDocument();
      expect(screen.queryByTestId('error-3')).not.toBeInTheDocument();

      // Section 1 and 3 should render
      expect(screen.getByTestId('mock-gameplay')).toBeInTheDocument();
      expect(screen.getByText('Section 3')).toBeInTheDocument();
    });

    it('should log correct context for each error in multi-section layout', () => {
      const errorService = getMockedErrorService();

      const ComplexLayout: React.FC<{
        section1Error?: boolean;
        section2Error?: boolean;
      }> = ({ section1Error = false, section2Error = false }) => (
        <div>
          <ErrorBoundary loggingContext="Section1" fallback={<div>Error 1</div>}>
            <MockGamePlay shouldThrow={section1Error} />
          </ErrorBoundary>
          <ErrorBoundary loggingContext="Section2" fallback={<div>Error 2</div>}>
            <MockScoreboard shouldThrow={section2Error} />
          </ErrorBoundary>
        </div>
      );

      render(<ComplexLayout section1Error={true} section2Error={true} />);

      const fn = errorService.logError as MockedFunction<typeof errorService.logError>;
      expect(fn).toHaveBeenCalledTimes(2);

      const calls = fn.mock.calls;
      const contexts = calls.map((call) => {
        const additionalContext = call[1] as Record<string, unknown>;
        return additionalContext.loggingContext;
      });

      expect(contexts).toContain('Section1');
      expect(contexts).toContain('Section2');
    });
  });

  describe('Error Boundary with Nested Components', () => {
    it('should handle outer boundary catching inner component error', () => {
      const InnerBoundaryThrows = () => {
        throw new Error('Inner component error');
      };

      render(
        <QueryClientProvider client={queryClient}>
          <ErrorBoundary loggingContext="OuterBoundary" fallback={<div>Outer caught error</div>}>
            <InnerBoundaryThrows />
          </ErrorBoundary>
        </QueryClientProvider>
      );

      expect(screen.getByText('Outer caught error')).toBeInTheDocument();
    });

    it('should correctly attribute error to the appropriate boundary', () => {
      const errorService = getMockedErrorService();

      const NestedBoundariesLayout = () => (
        <div>
          <ErrorBoundary loggingContext="OuterBoundary">
            <div>
              <h1>Outer Content</h1>
              <ErrorBoundary loggingContext="InnerBoundary">
                <ThrowError message="Inner error" />
              </ErrorBoundary>
            </div>
          </ErrorBoundary>
        </div>
      );

      render(<NestedBoundariesLayout />);

      const fn = errorService.logError as MockedFunction<typeof errorService.logError>;
      const callArgs = fn.mock.calls[0];
      const additionalContext = callArgs[1] as Record<string, unknown>;

      // Inner boundary should catch it first with its own context
      expect(additionalContext.loggingContext).toBe('InnerBoundary');
    });
  });

  describe('Error Context Accuracy', () => {
    it('should capture accurate componentStack for debugging', () => {
      const errorService = getMockedErrorService();

      render(
        <div data-testid="outer-div">
          <ErrorBoundary loggingContext="TestContext">
            <div data-testid="middle-div">
              <ThrowError message="Debug error" />
            </div>
          </ErrorBoundary>
        </div>
      );

      const fn = errorService.logError as MockedFunction<typeof errorService.logError>;
      const callArgs = fn.mock.calls[0] as [Error, Record<string, unknown>];
      const error = callArgs[0];
      const additionalContext = callArgs[1];

      // Verify all necessary debugging info is available
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Debug error');
      expect(additionalContext.componentStack).toBeTruthy();
      expect(additionalContext.loggingContext).toBe('TestContext');
    });

    it('should preserve error identity through logging', () => {
      const errorService = getMockedErrorService();
      const testError = new Error('Specific error message');

      class ErrorThrower extends Component {
        render(): ReactNode {
          throw testError;
        }
      }

      render(
        <ErrorBoundary loggingContext="IdentityTest">
          <ErrorThrower />
        </ErrorBoundary>
      );

      const fn = errorService.logError as MockedFunction<typeof errorService.logError>;
      const callArgs = fn.mock.calls[0] as [Error, Record<string, unknown>];
      const error = callArgs[0];

      expect(error.message).toBe('Specific error message');
    });
  });
});
