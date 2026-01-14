/**
 * Defines the structure for the execution context, holding telemetry information.
 */
export interface ExecutionContext {
  disableTelemetry?: boolean;
  distinctId?: string;
}

// Module-level variable to hold the current context.
// Initialize with default values (telemetry enabled, no distinctId yet).
let currentContext: ExecutionContext = {
  disableTelemetry: false,
};

/**
 * Sets the global execution context.
 * This should be called early in the command lifecycle.
 * @param context The context object containing distinctId and disableTelemetry status.
 */
export function setExecutionContext(context: ExecutionContext): void {
  currentContext = context;
}

/**
 * Gets the currently set global execution context.
 * @returns The current execution context.
 */
export function getExecutionContext(): ExecutionContext {
  return currentContext;
}
