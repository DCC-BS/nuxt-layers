export default defineEventHandler((event) => {
    const logger = getEventLogger(event);

    logger.debug("This is a debug");
    logger.error(
        {
            a: 2,
            b: "a string",
            c: [1, 2, 3],
            d: { msg: "hello world" },
        },
        "This is a error with an object",
    );

    logger.info("This is a info");
    logger.warn("This is a warning");
    logger.error("This is an error");

    const breadcrumbs = logger.getBreadcrumbs();
    logger.info(`Total breadcrumbs: ${breadcrumbs.length}`);
    logger.clearBreadcrumbs();
});
