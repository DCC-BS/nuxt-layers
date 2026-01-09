import { pino, type TransportTargetOptions } from "pino";

export default defineNitroPlugin((nitroApp) => {
    const productionTargets = [
        {
            target: "pino/file",
            level: "warn",
            options: { destination: 1 },
        },
    ] as TransportTargetOptions[];

    const devTargets = [
        {
            target: "pino-pretty",
            level: "trace",
            options: {
                colorize: false,
            },
        },
    ] as TransportTargetOptions[];

    // Import the logger function from the utils folder
    const logger = pino({
        base: { origin: "api" },
        timestamp: true,
        transport: {
            targets: import.meta.dev ? devTargets : productionTargets,
        },
    });

    nitroApp.hooks.hook("error", (error) => {
        logger.error(error, "An error occurred:");
    });

    // Expose the variable to the Nitro context
    nitroApp.hooks.hook("request", (event) => {
        event.context.logger = logger;
    });

    // Log a message to indicate that the logger is ready
    logger.info("pino logger initialized");
});
