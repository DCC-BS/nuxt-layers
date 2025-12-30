export default defineNuxtConfig({
    extends: ["../../auth", ".."],
    i18n: {
        defaultLocale: "de",
        strategy: "no_prefix",
    },
});
