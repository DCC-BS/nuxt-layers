import { useNuxtApp } from "#app";

/**
 * Composable to access the logger throughout the application
 *
 * @returns The pino logger instance
 */
export function useLogger(): BaseLogger {
    const { $logger } = useNuxtApp();

    if (!$logger) {
        throw new Error(
            "Logger not available. Make sure the winston plugin is properly initialized.",
        );
    }

    return $logger as BaseLogger;
}
