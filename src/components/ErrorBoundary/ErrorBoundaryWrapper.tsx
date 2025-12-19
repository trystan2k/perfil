import type { ReactElement, ReactNode } from 'react';
import ErrorBoundary from './ErrorBoundary.tsx';

interface ErrorBoundaryWrapperProps {
  children: ReactNode;
  loggingContext?: string;
}

export function ErrorBoundaryWrapper({
  children,
  loggingContext = 'Route',
}: ErrorBoundaryWrapperProps): ReactElement {
  return <ErrorBoundary loggingContext={loggingContext}>{children}</ErrorBoundary>;
}
