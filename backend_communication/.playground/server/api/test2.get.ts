export default backendHandlerBuilder()
    .withDummyFetcher((options) => {
        return {
            url: options.url,
            method: options.method,
        };
    })
    .build("/some/url");
