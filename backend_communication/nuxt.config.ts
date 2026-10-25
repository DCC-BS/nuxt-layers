import { fileURLToPath } from "node:url";

// NUXT_LAYERS_LOCAL=true resolves sibling layers from this checkout instead of GitHub (used by CI)
const loggerLayer = process.env.NUXT_LAYERS_LOCAL
    ? fileURLToPath(new URL("../logger", import.meta.url))
    : "github:DCC-BS/nuxt-layers/logger";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    $meta: {
        name: "backend_communication",
    },
    extends: [loggerLayer],
    devtools: { enabled: true },
    runtimeConfig: {
        apiUrl: process.env.API_URL,
        useDummyData: process.env.DUMMY || "",
    },
});
