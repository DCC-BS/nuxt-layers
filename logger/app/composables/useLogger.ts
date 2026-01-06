import { useNuxtApp } from "#app";

/**
 * Composable to access the logger throughout the application
 *
 * @returns The Winston logger instance
 */
export function useLogger(): ILogger {
    // Access the logger from the plugin
    const { $logger } = useNuxtApp();

    // Check if logger exists, which should be provided by the winston.server.ts plugin
    if (!$logger) {
        throw new Error(
            "Logger not available. Make sure the winston plugin is properly initialized.",
        );
    }

    return $logger as ILogger;
}
