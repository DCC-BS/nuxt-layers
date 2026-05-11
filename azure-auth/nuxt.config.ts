export default defineNuxtConfig({
    $meta: {
        name: "azure-auth",
    },
    devtools: { enabled: true },
    modules: ["@nuxtjs/i18n"],
    i18n: {
        locales: [
            {
                code: "en",
                name: "English",
                file: "en.json",
            },
            {
                code: "de",
                name: "Deutsch",
                file: "de.json",
            },
        ],
    },
    runtimeConfig: {
        azureAuth: {
            tenantId: "",
            clientId: "",
            clientSecret: "",
            apiClientId: "",
            secret: "",
            origin: "",
        },
    },
});
