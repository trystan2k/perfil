import { CategorySelect } from './CategorySelect';
import { QueryProvider } from './QueryProvider';

interface CategorySelectWithProviderProps {
  sessionId: string;
}

export function CategorySelectWithProvider({ sessionId }: CategorySelectWithProviderProps) {
  return (
    <QueryProvider>
      <CategorySelect sessionId={sessionId} />
    </QueryProvider>
  );
}
