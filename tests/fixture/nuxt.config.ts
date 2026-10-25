import { fileURLToPath } from "node:url";

// Same combination the apps use (text-mate-frontend), but every layer comes from this checkout.
// Nested references (auth -> backend_communication -> logger) follow NUXT_LAYERS_LOCAL, which the
// e2e test sets together with AUTH_LAYER_URI / LOGGER_LAYER_URI.
function layer(name: string): string {
    return fileURLToPath(new URL(`../../${name}`, import.meta.url));
}

export default defineNuxtConfig({
    compatibilityDate: "2026-07-27",
    devtools: { enabled: false },
    extends: [
        layer("auth"),
        layer("backend_communication"),
        layer("health_check"),
        layer("logger"),
        layer("dcc-app-config"),
        layer("feedback-control"),
    ],
    runtimeConfig: {
        public: {
            appConfig: {
                appListUrlTemplate: "https://{APP_NAME}.example.test",
            },
        },
    },
});
