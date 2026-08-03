import { Component, type ReactNode } from 'react';

import { logError } from '@/lib/telemetry';

import { ErrorFallback } from './error-fallback';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/** Captura erros de renderização e mostra um fallback amigável (Etapa 18). */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    logError(error, { componentStack: info.componentStack ?? undefined });
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return <ErrorFallback error={this.state.error} onRetry={this.reset} />;
    }
    return this.props.children;
  }
}
