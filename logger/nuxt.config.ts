// https://nuxt.com/docs/api/configuration/nuxt-config
import type { SourceOptions } from "c12";

function getExtends() {
    const layers: Array<[string, SourceOptions?]> = [];

    if (process.env.LOGGER_LAYER_URI) {
        layers.push([process.env.LOGGER_LAYER_URI]);
    }

    return layers;
}

export default defineNuxtConfig({
    $meta: {
        name: "logger",
    },
    devtools: { enabled: true },
    extends: getExtends(),
});
