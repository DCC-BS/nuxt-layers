import { useNuxtApp } from "#app";
import type { BaseLogger } from "#layers/logger/shared/types/logger";

/**
 * Composable to access the logger throughout the application
 *
 * @returns The logger instance
 */
export function useLogger(): BaseLogger {
    // Access the logger from the plugin
    const { $logger } = useNuxtApp();

    // Check if logger exists, which should be provided by the a plugin
    if (!$logger) {
        throw new Error(
            "Logger not available. Make sure the logger plugin is properly initialized.",
        );
    }

    return $logger as BaseLogger;
}
