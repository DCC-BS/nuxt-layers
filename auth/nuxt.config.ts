import { fileURLToPath } from "node:url";
import type { SourceOptions } from "c12";

function getExtends() {
    const layers: Array<[string, SourceOptions?]> = [];

    if (process.env.AUTH_LAYER_URI) {
        layers.push([process.env.AUTH_LAYER_URI, { install: true }]);
    }

    // NUXT_LAYERS_LOCAL=true resolves sibling layers from this checkout instead of GitHub (used by CI)
    if (process.env.NUXT_LAYERS_LOCAL) {
        layers.push([
            fileURLToPath(new URL("../backend_communication", import.meta.url)),
        ]);
    } else {
        layers.push([
            "github:DCC-BS/nuxt-layers/backend_communication",
            { install: true },
        ]);
    }

    return layers;
}

export default defineNuxtConfig({
    $meta: {
        name: "auth",
    },
    devtools: { enabled: true },
    extends: getExtends(),
});
