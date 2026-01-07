/**
 * Composable to access the logger throughout the application
 *
 * @returns The pino logger instance
 */
export function useLogger(): BaseLogger {
    const { $logger } = useNuxtApp();

    if (!$logger) {
        throw new Error(
            "Logger not available. Make sure the pino-logger plugin is properly initialized.",
        );
    }

    return $logger as BaseLogger;
}
