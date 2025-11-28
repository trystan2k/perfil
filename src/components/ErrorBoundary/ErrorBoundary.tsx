import { Component, type ErrorInfo, type ReactNode } from 'react';
import { getErrorService } from '@/services/ErrorService';
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

    errorService.logError(error, {
      componentStack: errorInfo.componentStack,
      loggingContext: loggingContext || 'Unknown',
    });
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: undefined,
    });
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
        <FallbackUI error={error} onRetry={this.handleRetry} loggingContext={loggingContext} />
      );
    }

    return children;
  }
}

export default ErrorBoundary;
