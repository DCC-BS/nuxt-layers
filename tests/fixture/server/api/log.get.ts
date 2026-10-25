// pino-logger: the request hook puts a logger on every event
export default defineEventHandler((event) => {
    getEventLogger(event).info("fixture log endpoint");
    return { logged: true };
});
