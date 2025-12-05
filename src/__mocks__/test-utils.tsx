import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type RenderOptions, render } from '@testing-library/react';
import translations from '../../public/locales/en/translation.json';
import { TranslationInitializer } from '../components/TranslationInitializer';

const locale = 'en';

export const customRender = (
  ui: React.ReactNode,
  {
    withQueryProvider = false,
    ...restOptions
  }: RenderOptions & { withQueryProvider?: boolean } = {}
) => {
  function Wrapper({ children }: { children: React.ReactNode }) {
    const queryClient = withQueryProvider
      ? new QueryClient({
          defaultOptions: {
            queries: {
              retry: false,
            },
          },
        })
      : null;

    return (
      <>
        <TranslationInitializer locale={locale} translations={translations} />
        {withQueryProvider && queryClient ? (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ) : (
          children
        )}
      </>
    );
  }

  return render(ui, { wrapper: Wrapper, ...restOptions });
};
