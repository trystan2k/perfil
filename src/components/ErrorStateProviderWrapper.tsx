import type { ReactNode } from 'react';
import { ErrorStateProvider } from './ErrorStateProvider';

interface ErrorStateProviderWrapperProps {
  children: ReactNode;
}

/**
 * Wrapper component for ErrorStateProvider that can be used in Astro layouts
 */
export function ErrorStateProviderWrapper({ children }: ErrorStateProviderWrapperProps) {
  return <ErrorStateProvider>{children}</ErrorStateProvider>;
}
