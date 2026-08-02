import { QueryClientProvider } from '@tanstack/react-query';

import { queryClient } from './client';

/** Disponibiliza o TanStack Query para o app. */
export function ApiProvider({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
