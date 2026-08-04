// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    $meta: {
        name: "dcc-app-config",
    },
    runtimeConfig: {
        public: {
            appConfig: {
                appListUrlTemplate: "",
            }
        }
    },
    devtools: { enabled: true },
});
