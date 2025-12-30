import type { SourceOptions } from 'c12';

function getExtends() {
    const layers: Array<[string, SourceOptions?]> = [];

    if (process.env.AUTH_LAYER_URI) {
        layers.push([process.env.AUTH_LAYER_URI, { install: true }]);
    }

    layers.push(["github:DCC-BS/nuxt-layers/backend_communication", { install: true }]);

    return layers;
}

export default defineNuxtConfig({
    $meta: {
        name: 'auth',
    },
    devtools: { enabled: true },
    extends: getExtends(),
});
