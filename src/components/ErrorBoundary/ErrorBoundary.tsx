import { Component, type ErrorInfo, type ReactNode } from 'react';
import { getErrorService } from '@/services/ErrorService';
import { CompactHeader } from '../CompactHeader';
import FallbackUI from './FallbackUI';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, retry: () => void) => ReactNode);
  loggingContext?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { loggingContext } = this.props;
    const errorService = getErrorService();

    try {
      errorService.logError(error, {
        componentStack: errorInfo.componentStack,
        loggingContext: loggingContext || 'Unknown',
      });
    } catch (loggingError) {
      // Prevent logging failures from breaking the error boundary
      // Fall back to console.error in development
      if (process.env.NODE_ENV === 'development') {
        console.error('ErrorBoundary: Failed to log error to ErrorService', loggingError);
        console.error('Original error:', error);
      }
    }
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: undefined,
    });
    window.location.reload();
  };

  render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback, loggingContext } = this.props;

    if (hasError && error) {
      if (typeof fallback === 'function') {
        return fallback(error, this.handleRetry);
      }

      if (fallback) {
        return fallback;
      }

      return (
        <>
          <CompactHeader variant="auto" isVisible={true} onSettingsClick={() => {}} />
          <FallbackUI error={error} onRetry={this.handleRetry} loggingContext={loggingContext} />
        </>
      );
    }

    return children;
  }
}

export default ErrorBoundary;
