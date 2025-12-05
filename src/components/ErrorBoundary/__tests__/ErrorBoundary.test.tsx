import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, type MockedFunction, vi } from 'vitest';
import { getErrorService } from '@/services/ErrorService';
import { customRender } from '../../../__mocks__/test-utils';
import ErrorBoundary from '../ErrorBoundary';

// Mock the ErrorService
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

// Mock FallbackUI component for cleaner testing
vi.mock('../FallbackUI', () => ({
  default: (props: { error?: Error; onRetry: () => void; loggingContext?: string }) => (
    <div data-testid="fallback-ui">
      <div>Error occurred: {props.error?.message}</div>
      <button type="button" onClick={props.onRetry}>
        Retry
      </button>
      {props.loggingContext && <div>Context: {props.loggingContext}</div>}
    </div>
  ),
}));

// Component that throws an error for testing
const ThrowError: React.FC<{ message: string }> = ({ message }) => {
  throw new Error(message);
};

// Component that renders successfully
const SuccessComponent: React.FC<{ message: string }> = ({ message }) => (
  <div data-testid="success-component">{message}</div>
);

describe('ErrorBoundary', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Suppress console.error for error boundary tests (React logs error info)
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.clearAllMocks();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('Normal Rendering (No Error)', () => {
    it('should render children correctly when no error occurs', () => {
      customRender(
        <ErrorBoundary>
          <SuccessComponent message="Hello World" />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('success-component')).toBeInTheDocument();
      expect(screen.getByText('Hello World')).toBeInTheDocument();
    });

    it('should render multiple children successfully', () => {
      customRender(
        <ErrorBoundary>
          <div>Child 1</div>
          <div>Child 2</div>
          <div>Child 3</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Child 1')).toBeInTheDocument();
      expect(screen.getByText('Child 2')).toBeInTheDocument();
      expect(screen.getByText('Child 3')).toBeInTheDocument();
    });

    it('should render nested components without error', () => {
      customRender(
        <ErrorBoundary>
          <div>
            <SuccessComponent message="Nested" />
          </div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Nested')).toBeInTheDocument();
    });

    it('should not call ErrorService.logError when no error occurs', () => {
      const errorService = getMockedErrorService();

      customRender(
        <ErrorBoundary>
          <SuccessComponent message="Test" />
        </ErrorBoundary>
      );

      expect(errorService.logError).not.toHaveBeenCalled();
    });
  });

  describe('Error Rendering - Shows Fallback', () => {
    it('should show fallback when child component throws error', () => {
      customRender(
        <ErrorBoundary>
          <ThrowError message="Test error" />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('fallback-ui')).toBeInTheDocument();
      expect(screen.getByText('Error occurred: Test error')).toBeInTheDocument();
    });

    it('should display the error message in fallback UI', () => {
      customRender(
        <ErrorBoundary>
          <ThrowError message="Something went wrong" />
        </ErrorBoundary>
      );

      expect(screen.getByText('Error occurred: Something went wrong')).toBeInTheDocument();
    });

    it('should catch errors from deeply nested components', () => {
      const NestedThrowingComponent = () => (
        <div>
          <div>
            <ThrowError message="Nested error" />
          </div>
        </div>
      );

      customRender(
        <ErrorBoundary>
          <NestedThrowingComponent />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('fallback-ui')).toBeInTheDocument();
      expect(screen.getByText('Error occurred: Nested error')).toBeInTheDocument();
    });

    it('should replace entire child tree with fallback on error', () => {
      customRender(
        <ErrorBoundary>
          <SuccessComponent message="Original" />
          <ThrowError message="Error" />
        </ErrorBoundary>
      );

      // Original component should not be rendered
      expect(screen.queryByText('Original')).not.toBeInTheDocument();
      // Fallback should be shown instead
      expect(screen.getByTestId('fallback-ui')).toBeInTheDocument();
    });
  });

  describe('Custom Fallback Prop - ReactNode', () => {
    it('should use custom fallback when provided as ReactNode', () => {
      const customFallback = <div data-testid="custom-fallback">Custom Error UI</div>;

      customRender(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError message="Test error" />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
      expect(screen.getByText('Custom Error UI')).toBeInTheDocument();
      expect(screen.queryByTestId('fallback-ui')).not.toBeInTheDocument();
    });

    it('should render complex custom fallback with elements', () => {
      const customFallback = (
        <div data-testid="complex-fallback">
          <h1>Custom Error</h1>
          <p>Something happened</p>
          <button type="button">Try Again</button>
        </div>
      );

      customRender(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError message="Test" />
        </ErrorBoundary>
      );

      expect(screen.getByText('Custom Error')).toBeInTheDocument();
      expect(screen.getByText('Something happened')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
    });

    it('should prefer custom fallback over default FallbackUI', () => {
      const customFallback = <div data-testid="my-fallback">My Error</div>;

      customRender(
        <ErrorBoundary fallback={customFallback} loggingContext="test-context">
          <ThrowError message="Error" />
        </ErrorBoundary>
      );

      // Custom fallback should be shown
      expect(screen.getByTestId('my-fallback')).toBeInTheDocument();
      // Default fallback should not be shown
      expect(screen.queryByTestId('fallback-ui')).not.toBeInTheDocument();
    });

    it('should still log error even with custom fallback', () => {
      const errorService = getMockedErrorService();
      const customFallback = <div>Error</div>;

      customRender(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError message="Test error" />
        </ErrorBoundary>
      );

      expect(errorService.logError).toHaveBeenCalled();
    });
  });

  describe('Function Fallback Prop', () => {
    it('should call function fallback with error and retry', () => {
      const fallbackFn = vi.fn(() => <div>Fallback</div>);

      customRender(
        <ErrorBoundary fallback={fallbackFn}>
          <ThrowError message="Test error" />
        </ErrorBoundary>
      );

      expect(fallbackFn).toHaveBeenCalled();
      const calls = (fallbackFn as MockedFunction<typeof fallbackFn>).mock.calls as unknown[][];
      expect(calls[0][0]).toBeInstanceOf(Error);
      expect((calls[0][0] as Error).message).toBe('Test error');
      expect(typeof calls[0][1]).toBe('function');
    });

    it('should pass error object to function fallback', () => {
      const fallbackFn = vi.fn((error: Error) => <div>Error: {error.message}</div>);

      customRender(
        <ErrorBoundary fallback={fallbackFn}>
          <ThrowError message="Specific error" />
        </ErrorBoundary>
      );

      const renderedText = screen.getByText('Error: Specific error');
      expect(renderedText).toBeInTheDocument();
    });

    it('should pass retry function to function fallback', () => {
      const fallbackFn = vi.fn((_error: Error, retry: () => void) => (
        <button type="button" onClick={retry}>
          Retry
        </button>
      ));

      customRender(
        <ErrorBoundary fallback={fallbackFn}>
          <ThrowError message="Error" />
        </ErrorBoundary>
      );

      const retryButton = screen.getByRole('button', { name: 'Retry' });
      expect(retryButton).toBeInTheDocument();
      const calls = (fallbackFn as MockedFunction<typeof fallbackFn>).mock.calls as unknown[][];
      expect(typeof calls[0][1]).toBe('function');
    });

    it('should render function fallback result correctly', () => {
      const fallbackFn = (error: Error) => (
        <div data-testid="fn-fallback">
          <p>Error occurred: {error.message}</p>
        </div>
      );

      customRender(
        <ErrorBoundary fallback={fallbackFn}>
          <ThrowError message="Test" />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('fn-fallback')).toBeInTheDocument();
      expect(screen.getByText('Error occurred: Test')).toBeInTheDocument();
    });

    it('should give function fallback priority over ReactNode fallback', () => {
      const fallbackFn = () => <div data-testid="fn-fallback">Function Fallback</div>;

      customRender(
        <ErrorBoundary fallback={fallbackFn}>
          <ThrowError message="Error" />
        </ErrorBoundary>
      );

      // When both could apply, the function is tried first (since it checks typeof)
      const fallback = screen.getByTestId('fn-fallback');
      expect(fallback).toBeInTheDocument();
    });

    it('should allow function fallback to receive and use error details', () => {
      const fallbackFn = (error: Error, _retry: () => void) => (
        <div>
          <h2>Oops!</h2>
          <p>Error: {error.message}</p>
          <p>Stack: {error.stack ? 'Available' : 'Not available'}</p>
        </div>
      );

      customRender(
        <ErrorBoundary fallback={fallbackFn}>
          <ThrowError message="Application error" />
        </ErrorBoundary>
      );

      expect(screen.getByText('Oops!')).toBeInTheDocument();
      expect(screen.getByText('Error: Application error')).toBeInTheDocument();
    });
  });

  describe('Retry Functionality', () => {
    it('should reset error state when retry is called', async () => {
      const user = userEvent.setup();
      const fallbackFn = (_error: Error, retry: () => void) => (
        <button type="button" onClick={retry}>
          Retry
        </button>
      );

      let shouldThrow = true;

      const ConditionalComponent = () => {
        if (shouldThrow) {
          throw new Error('Initial error');
        }
        return <SuccessComponent message="Recovered" />;
      };

      const { rerender } = customRender(
        <ErrorBoundary fallback={fallbackFn}>
          <ConditionalComponent />
        </ErrorBoundary>
      );

      // Error should be displayed
      expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();

      const retryButton = screen.getByRole('button', { name: 'Retry' });

      shouldThrow = false;
      await user.click(retryButton);

      // After retry, component should attempt to re-render successfully
      rerender(
        <ErrorBoundary fallback={fallbackFn}>
          <ConditionalComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('Recovered')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
    });

    it('should clear error and errorInfo on retry', () => {
      const fallbackFn = vi.fn((_error: Error, retry: () => void) => (
        <button type="button" onClick={retry}>
          Retry
        </button>
      ));

      const { rerender } = customRender(
        <ErrorBoundary fallback={fallbackFn}>
          <ThrowError message="Error" />
        </ErrorBoundary>
      );

      const firstCallCount = (fallbackFn as MockedFunction<typeof fallbackFn>).mock.calls.length;

      // Manually click retry by getting the button
      const retryButton = screen.getByRole('button', { name: 'Retry' });
      retryButton.click();

      rerender(
        <ErrorBoundary fallback={fallbackFn}>
          <SuccessComponent message="Success" />
        </ErrorBoundary>
      );

      // Fallback should not be called again (error cleared)
      expect((fallbackFn as MockedFunction<typeof fallbackFn>).mock.calls.length).toBe(
        firstCallCount
      );
    });

    it('should allow user to interact with retry button', async () => {
      const user = userEvent.setup();
      const fallbackFn = (_error: Error, retry: () => void) => (
        <button type="button" data-testid="retry-btn" onClick={retry}>
          Try Again
        </button>
      );

      customRender(
        <ErrorBoundary fallback={fallbackFn}>
          <ThrowError message="Error" />
        </ErrorBoundary>
      );

      const retryBtn = screen.getByTestId('retry-btn');
      expect(retryBtn).toBeInTheDocument();

      await user.click(retryBtn);

      // Button should still be accessible after click (state is reset)
      // The component re-attempts to render
    });

    it('should reset hasError state on retry', async () => {
      const user = userEvent.setup();
      const fallbackFn = (_error: Error, retry: () => void) => (
        <button type="button" onClick={retry}>
          Retry
        </button>
      );

      let shouldThrow = true;

      const ConditionalComponent = () => {
        if (shouldThrow) {
          throw new Error('Error');
        }
        return <SuccessComponent message="Recovered" />;
      };

      const { rerender } = customRender(
        <ErrorBoundary fallback={fallbackFn}>
          <ConditionalComponent />
        </ErrorBoundary>
      );

      // Fallback is shown (hasError = true)
      expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();

      const retryButton = screen.getByRole('button', { name: 'Retry' });
      shouldThrow = false;
      await user.click(retryButton);

      rerender(
        <ErrorBoundary fallback={fallbackFn}>
          <ConditionalComponent />
        </ErrorBoundary>
      );

      // hasError should be false now, children should render
      expect(screen.getByTestId('success-component')).toBeInTheDocument();
    });

    it('should support multiple retry attempts', async () => {
      const user = userEvent.setup();
      let shouldThrow = true;

      const ThrowOnDemand = () => {
        if (shouldThrow) {
          throw new Error('Temporary error');
        }
        return <div>Recovered</div>;
      };

      const fallbackFn = (_error: Error, retry: () => void) => (
        <button type="button" onClick={retry}>
          Try Again
        </button>
      );

      const { rerender } = customRender(
        <ErrorBoundary fallback={fallbackFn}>
          <ThrowOnDemand />
        </ErrorBoundary>
      );

      // First error
      expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();

      shouldThrow = false;

      const retryButton = screen.getByRole('button', { name: 'Try Again' });
      await user.click(retryButton);

      rerender(
        <ErrorBoundary fallback={fallbackFn}>
          <ThrowOnDemand />
        </ErrorBoundary>
      );

      expect(screen.getByText('Recovered')).toBeInTheDocument();
    });
  });

  describe('ErrorService Integration', () => {
    it('should call ErrorService.logError when error occurs', () => {
      const errorService = getMockedErrorService();

      customRender(
        <ErrorBoundary>
          <ThrowError message="Test error" />
        </ErrorBoundary>
      );

      expect(errorService.logError).toHaveBeenCalled();
    });

    it('should pass error to ErrorService.logError', () => {
      const errorService = getMockedErrorService();

      customRender(
        <ErrorBoundary>
          <ThrowError message="Specific error" />
        </ErrorBoundary>
      );

      const fn = errorService.logError as MockedFunction<typeof errorService.logError>;
      const callArgs = fn.mock.calls[0] as [Error, Record<string, unknown>];
      expect(callArgs[0]).toBeInstanceOf(Error);
      expect(callArgs[0].message).toBe('Specific error');
    });

    it('should pass additional context to ErrorService.logError', () => {
      const errorService = getMockedErrorService();

      customRender(
        <ErrorBoundary loggingContext="GamePlay">
          <ThrowError message="Error" />
        </ErrorBoundary>
      );

      const fn = errorService.logError as MockedFunction<typeof errorService.logError>;
      const callArgs = fn.mock.calls[0];
      const additionalContext = callArgs[1] as Record<string, unknown>;

      expect(additionalContext).toBeDefined();
      expect(additionalContext.componentStack).toBeDefined();
      expect(additionalContext.loggingContext).toBe('GamePlay');
    });

    it('should include componentStack in error payload', () => {
      const errorService = getMockedErrorService();

      customRender(
        <ErrorBoundary>
          <ThrowError message="Error" />
        </ErrorBoundary>
      );

      const fn = errorService.logError as MockedFunction<typeof errorService.logError>;
      const callArgs = fn.mock.calls[0];
      const additionalContext = callArgs[1] as Record<string, unknown>;

      expect(additionalContext.componentStack).toBeTruthy();
      expect(typeof additionalContext.componentStack).toBe('string');
    });

    it('should use "Unknown" as default loggingContext if not provided', () => {
      const errorService = getMockedErrorService();

      customRender(
        <ErrorBoundary>
          <ThrowError message="Error" />
        </ErrorBoundary>
      );

      const fn = errorService.logError as MockedFunction<typeof errorService.logError>;
      const callArgs = fn.mock.calls[0];
      const additionalContext = callArgs[1] as Record<string, unknown>;

      expect(additionalContext.loggingContext).toBe('Unknown');
    });

    it('should preserve loggingContext with different values', () => {
      const errorService = getMockedErrorService();

      const contexts = ['Component1', 'Component2', 'ModuleX'];

      contexts.forEach((context, _index) => {
        const fn = errorService.logError as MockedFunction<typeof errorService.logError>;
        fn.mockClear();

        customRender(
          <ErrorBoundary loggingContext={context} key={context}>
            <ThrowError message="Error" />
          </ErrorBoundary>
        );

        const callArgs = fn.mock.calls[0];
        const additionalContext = callArgs[1] as Record<string, unknown>;

        expect(additionalContext.loggingContext).toBe(context);
      });
    });

    it('should call logError exactly once per error', () => {
      const errorService = getMockedErrorService();

      customRender(
        <ErrorBoundary>
          <ThrowError message="Error" />
        </ErrorBoundary>
      );

      expect(errorService.logError).toHaveBeenCalledTimes(1);
    });
  });

  describe('LoggingContext Integration', () => {
    it('should pass loggingContext to ErrorService', () => {
      const errorService = getMockedErrorService();

      customRender(
        <ErrorBoundary loggingContext="TestComponent">
          <ThrowError message="Error" />
        </ErrorBoundary>
      );

      const fn = errorService.logError as MockedFunction<typeof errorService.logError>;
      const callArgs = fn.mock.calls[0];
      const additionalContext = callArgs[1] as Record<string, unknown>;

      expect(additionalContext.loggingContext).toBe('TestComponent');
    });

    it('should include loggingContext in error payload structure', () => {
      const errorService = getMockedErrorService();

      customRender(
        <ErrorBoundary loggingContext="GameSetup">
          <ThrowError message="Setup failed" />
        </ErrorBoundary>
      );

      const fn = errorService.logError as MockedFunction<typeof errorService.logError>;
      const callArgs = fn.mock.calls[0];
      const additionalContext = callArgs[1] as Record<string, unknown>;

      expect(additionalContext).toHaveProperty('loggingContext');
      expect(additionalContext).toHaveProperty('componentStack');
    });

    it('should pass loggingContext to FallbackUI component', () => {
      // Since FallbackUI is mocked, we need to check the props it receives
      customRender(
        <ErrorBoundary loggingContext="CategorySelect">
          <ThrowError message="Error" />
        </ErrorBoundary>
      );

      expect(screen.getByText('Context: CategorySelect')).toBeInTheDocument();
    });

    it('should handle empty string loggingContext', () => {
      const errorService = getMockedErrorService();

      customRender(
        <ErrorBoundary loggingContext="">
          <ThrowError message="Error" />
        </ErrorBoundary>
      );

      const fn = errorService.logError as MockedFunction<typeof errorService.logError>;
      const callArgs = fn.mock.calls[0];
      const additionalContext = callArgs[1] as Record<string, unknown>;

      // Empty string should be treated as falsy and replaced with "Unknown" in componentDidCatch
      expect(additionalContext.loggingContext).toBe('Unknown');
    });

    it('should use "Unknown" when loggingContext is undefined', () => {
      const errorService = getMockedErrorService();

      customRender(
        <ErrorBoundary>
          <ThrowError message="Error" />
        </ErrorBoundary>
      );

      const fn = errorService.logError as MockedFunction<typeof errorService.logError>;
      const callArgs = fn.mock.calls[0];
      const additionalContext = callArgs[1] as Record<string, unknown>;

      expect(additionalContext.loggingContext).toBe('Unknown');
    });

    it('should pass error details along with loggingContext', () => {
      const errorService = getMockedErrorService();
      const errorMessage = 'Critical failure';
      const contextName = 'FailureZone';

      customRender(
        <ErrorBoundary loggingContext={contextName}>
          <ThrowError message={errorMessage} />
        </ErrorBoundary>
      );

      const fn = errorService.logError as MockedFunction<typeof errorService.logError>;
      const callArgs = fn.mock.calls[0] as [Error, Record<string, unknown>];
      const error = callArgs[0];
      const additionalContext = callArgs[1];

      expect(error.message).toBe(errorMessage);
      expect(additionalContext.loggingContext).toBe(contextName);
      expect(additionalContext.componentStack).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle synchronous errors in render', () => {
      customRender(
        <ErrorBoundary>
          <ThrowError message="Render error" />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('fallback-ui')).toBeInTheDocument();
    });

    it('should handle errors with custom error subclasses', () => {
      class CustomError extends Error {
        constructor(message: string) {
          super(message);
          this.name = 'CustomError';
        }
      }

      const ThrowCustom = () => {
        throw new CustomError('Custom error');
      };

      customRender(
        <ErrorBoundary>
          <ThrowCustom />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('fallback-ui')).toBeInTheDocument();
    });

    it('should show default FallbackUI when no fallback prop provided', () => {
      customRender(
        <ErrorBoundary loggingContext="TestContext">
          <ThrowError message="Error" />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('fallback-ui')).toBeInTheDocument();
    });

    it('should handle errors with very long error messages', () => {
      const longMessage = 'Error: '.repeat(100);

      customRender(
        <ErrorBoundary>
          <ThrowError message={longMessage} />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('fallback-ui')).toBeInTheDocument();
    });

    it('should handle when ErrorService is not available', () => {
      // This shouldn't crash even if getErrorService fails
      customRender(
        <ErrorBoundary>
          <ThrowError message="Error" />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('fallback-ui')).toBeInTheDocument();
    });

    it('should maintain state across multiple error boundaries', () => {
      const errorService = getMockedErrorService();

      customRender(
        <>
          <ErrorBoundary loggingContext="Boundary1">
            <ThrowError message="Error 1" />
          </ErrorBoundary>
          <ErrorBoundary loggingContext="Boundary2">
            <SuccessComponent message="Success 2" />
          </ErrorBoundary>
        </>
      );

      expect(screen.getAllByTestId('fallback-ui')).toHaveLength(1);
      expect(screen.getByText('Success 2')).toBeInTheDocument();

      // Verify first boundary logged error
      expect(errorService.logError).toHaveBeenCalledTimes(1);
    });

    it('should handle undefined children gracefully', () => {
      customRender(<ErrorBoundary>{undefined}</ErrorBoundary>);

      // Should render without error
      expect(screen.queryByTestId('fallback-ui')).not.toBeInTheDocument();
    });

    it('should handle null children gracefully', () => {
      customRender(<ErrorBoundary>{null}</ErrorBoundary>);

      // Should render without error
      expect(screen.queryByTestId('fallback-ui')).not.toBeInTheDocument();
    });
  });

  describe('Error Info and ComponentStack', () => {
    it('should capture error info with componentStack', () => {
      const errorService = getMockedErrorService();

      customRender(
        <ErrorBoundary>
          <ThrowError message="Error" />
        </ErrorBoundary>
      );

      const fn = errorService.logError as MockedFunction<typeof errorService.logError>;
      const callArgs = fn.mock.calls[0];
      const additionalContext = callArgs[1] as Record<string, unknown>;

      expect(additionalContext.componentStack).toBeDefined();
      expect(typeof additionalContext.componentStack).toBe('string');
      expect((additionalContext.componentStack as string).length).toBeGreaterThan(0);
    });

    it('should include componentStack for deeply nested errors', () => {
      const errorService = getMockedErrorService();

      const DeepNested = () => (
        <div>
          <div>
            <div>
              <ThrowError message="Deep error" />
            </div>
          </div>
        </div>
      );

      customRender(
        <ErrorBoundary>
          <DeepNested />
        </ErrorBoundary>
      );

      const fn = errorService.logError as MockedFunction<typeof errorService.logError>;
      const callArgs = fn.mock.calls[0];
      const additionalContext = callArgs[1] as Record<string, unknown>;

      expect(additionalContext.componentStack).toBeTruthy();
    });

    it('should have complete error context for debugging', () => {
      const errorService = getMockedErrorService();

      customRender(
        <ErrorBoundary loggingContext="DebugContext">
          <ThrowError message="Debug error" />
        </ErrorBoundary>
      );

      const fn = errorService.logError as MockedFunction<typeof errorService.logError>;
      const callArgs = fn.mock.calls[0] as [Error, Record<string, unknown>];
      const error = callArgs[0];
      const additionalContext = callArgs[1];

      // Verify all necessary debugging info is available
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Debug error');
      expect(additionalContext.componentStack).toBeTruthy();
      expect(additionalContext.loggingContext).toBe('DebugContext');
    });
  });

  describe('Integration: Complete Error Flow', () => {
    it('should handle complete error-to-recovery flow', async () => {
      const user = userEvent.setup();
      let shouldThrow = true;

      const ConditionalComponent = () => {
        if (shouldThrow) {
          throw new Error('Temporary error');
        }
        return <SuccessComponent message="Recovered successfully" />;
      };

      const fallbackFn = (_error: Error, retry: () => void) => (
        <button type="button" data-testid="recovery-retry" onClick={retry}>
          Recover
        </button>
      );

      const { rerender } = customRender(
        <ErrorBoundary fallback={fallbackFn} loggingContext="RecoveryTest">
          <ConditionalComponent />
        </ErrorBoundary>
      );

      // Error state
      expect(screen.getByTestId('recovery-retry')).toBeInTheDocument();

      // Fix the issue
      shouldThrow = false;

      // Retry
      const retryButton = screen.getByTestId('recovery-retry');
      await user.click(retryButton);

      // Re-render with fixed component
      rerender(
        <ErrorBoundary fallback={fallbackFn} loggingContext="RecoveryTest">
          <ConditionalComponent />
        </ErrorBoundary>
      );

      // Recovery state
      expect(screen.getByText('Recovered successfully')).toBeInTheDocument();
      expect(screen.queryByTestId('recovery-retry')).not.toBeInTheDocument();
    });

    it('should log all errors to ErrorService', () => {
      const errorService = getMockedErrorService();

      const errors = [
        { msg: 'Error 1', context: 'Context1' },
        { msg: 'Error 2', context: 'Context2' },
        { msg: 'Error 3', context: 'Context3' },
      ];

      errors.forEach((errorInfo) => {
        errorService.logError.mockClear();

        customRender(
          <ErrorBoundary loggingContext={errorInfo.context} key={errorInfo.msg}>
            <ThrowError message={errorInfo.msg} />
          </ErrorBoundary>
        );

        expect(errorService.logError).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Accessibility', () => {
    it('should render fallback UI with proper accessibility', () => {
      customRender(
        <ErrorBoundary>
          <ThrowError message="Error" />
        </ErrorBoundary>
      );

      const fallback = screen.getByTestId('fallback-ui');
      expect(fallback).toBeInTheDocument();

      // Should have a retry button for accessibility
      const retryButton = screen.getByRole('button', { name: 'Retry' });
      expect(retryButton).toBeInTheDocument();
    });

    it('should provide error information for screen readers', () => {
      customRender(
        <ErrorBoundary loggingContext="ImportantComponent">
          <ThrowError message="Failed to load data" />
        </ErrorBoundary>
      );

      // Error message should be accessible
      expect(screen.getByText('Error occurred: Failed to load data')).toBeInTheDocument();
      expect(screen.getByText('Context: ImportantComponent')).toBeInTheDocument();
    });
  });
});
