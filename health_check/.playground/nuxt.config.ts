export default defineNuxtConfig({
    extends: ["..", "../../logger","../../pino-logger"],
    runtimeConfig: {
        public: {
            logger: {
                loglevel: "debug",
            }
        }
    }
});
