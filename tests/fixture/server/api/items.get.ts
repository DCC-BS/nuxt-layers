// backend_communication: GET without body, response mapped by postMap
export default backendHandlerBuilder()
    .postMap(async (items: unknown) => ({ wrapped: items }))
    .build("/items");
