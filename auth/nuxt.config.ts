export default defineNuxtConfig({
    $meta: {
        name: 'auth',
    },
    devtools: { enabled: true },
    extends: [[process.env.AUTH_LAYER_URI ?? undefined, { install: true }]],
});
