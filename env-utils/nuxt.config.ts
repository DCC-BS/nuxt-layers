import type { ZodObject } from "zod";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    $meta: {
        name: "env-utils",
    },
    devtools: { enabled: true },
    runtimeConfig: {
        env: {
            schemas: [] as ZodObject[],
        },
    },
});
