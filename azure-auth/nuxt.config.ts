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
        originEnvKey: "NUXT_AUTH_ORIGIN",
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
        auth: {
            azureAdTenantId: process.env.AUTH_AZURE_AD_TENANT_ID,
            azureAdClientId: process.env.AUTH_AZURE_AD_CLIENT_ID,
            azureAdClientSecret: process.env.AUTH_AZURE_AD_CLIENT_SECRET,
            azureAdAPIClientId: process.env.AUTH_AZURE_AD_API_CLIENT_ID,
            authSecret: process.env.AUTH_AUTH_SECRET,
            origin: "",
        }
    },
});
