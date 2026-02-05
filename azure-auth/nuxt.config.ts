// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    $meta: {
        name: "azure-auth",
    },
    devtools: { enabled: true },
    modules: ["@sidebase/nuxt-auth", "@nuxtjs/i18n"],
    auth: {
        isEnabled: true,
        globalAppMiddleware: true,
        originEnvKey: "NUXT_AZURE_AUTH_ORIGIN",
        provider: {
            type: "authjs",
            defaultProvider: "azureAd",
            addDefaultCallbackUrl: true,
        },
        sessionRefresh: {
            enablePeriodically: 10000,
            enableOnWindowFocus: true,
        },
    },
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
