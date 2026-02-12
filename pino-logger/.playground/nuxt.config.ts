export default defineNuxtConfig({
    extends: ["../../logger", ".."],
    runtimeConfig: {
        public: {
            logger: {
                breadcrumbs: {
                    enabled: true,
                    autoCollect: {
                        navigation: true,
                        xhr: true,
                    },
                },
            },
        },
    },
});
