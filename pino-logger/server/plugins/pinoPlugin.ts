import { pino } from "pino";

export default defineNitroPlugin((nitroApp) => {
    // Import the logger function from the utils folder
    const logger = pino({
        timestamp: true,
        transport: {
            targets: [
                // {
                //     target: "pino-pretty",
                //     level: import.meta.dev ? "trace" : "info",
                //     options: {
                //         colorize: true,
                //     },
                // },
                {
                    target: "pino/file",
                    options: {
                        destination: "./logs/app.log",
                        mkdir: true,
                    },
                    level: "error",
                },
            ],
        },
    });

    // Provide the logger to the application
    nitroApp.hooks.hook("error", (error) => {
        logger.error(error, "An error occurred:");
    });

    // Expose the variable to the Nitro context
    nitroApp.hooks.hook("request", (event) => {
        event.context.logger = logger;
    });

    // Log a message to indicate that the logger is ready
    logger.info("Winston logger initialized");
});
