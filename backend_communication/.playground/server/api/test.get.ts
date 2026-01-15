export default backendHandlerBuilder()
    .withFetcher((options) => {
        const logger = getEventLogger(options.event);
        logger.info(options, `Default Fetch at url ${options.url}`);

        return Promise.resolve({ isProd: true });
    })
    .withDummyFetcher({ isProd: false })
    .build("/some/url");
