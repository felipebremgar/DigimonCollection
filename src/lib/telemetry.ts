/**
 * Camada de telemetria / crash reporting (Etapa 18).
 *
 * Abstração plugável: por padrão registra no console (dev). Em produção,
 * conecte um provedor real (Sentry, etc.) com `setTelemetryHandler` no boot —
 * o resto do app chama só `logError` / `logEvent`.
 */

export interface TelemetryHandler {
  logError: (error: unknown, context?: Record<string, unknown>) => void;
  logEvent: (name: string, props?: Record<string, unknown>) => void;
}

const consoleHandler: TelemetryHandler = {
  logError: (error, context) => console.error('[telemetry] error', error, context ?? {}),
  logEvent: (name, props) => console.log('[telemetry] event', name, props ?? {}),
};

let handler: TelemetryHandler = consoleHandler;

/** Substitui o handler (ex.: instalar Sentry na inicialização). */
export function setTelemetryHandler(next: TelemetryHandler): void {
  handler = next;
}

export function logError(error: unknown, context?: Record<string, unknown>): void {
  handler.logError(error, context);
}

export function logEvent(name: string, props?: Record<string, unknown>): void {
  handler.logEvent(name, props);
}
