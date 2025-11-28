import type { ReactNode } from 'react';
import ErrorBoundary from './ErrorBoundary';

interface ErrorBoundaryWrapperProps {
  children: ReactNode;
  loggingContext?: string;
}

export function ErrorBoundaryWrapper({
  children,
  loggingContext = 'Route',
}: ErrorBoundaryWrapperProps) {
  return <ErrorBoundary loggingContext={loggingContext}>{children}</ErrorBoundary>;
}
