export default defineEventHandler((event) => {
    const logger = getEventLogger(event);

    logger.debug("This is a debug");
    logger.info("This is a info");
    logger.warn("This is a warning");
    logger.error("This is an error");
});
