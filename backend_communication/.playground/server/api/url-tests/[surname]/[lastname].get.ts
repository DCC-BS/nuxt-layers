export default backendHandlerBuilder()
    .withFetcher((options) => {
        const logger = getEventLogger(options.event);
        logger.info(options, `Default Fetch at url ${options.url}`);

        return Promise.resolve({ url: options.url });
    })
    .build("?lname=[r:lastname]&sname=[r:surname]&age=[q:age]&height=[q:height]");
