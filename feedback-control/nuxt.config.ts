// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    devtools: { enabled: true },
    modules: ["@nuxt/ui", "@nuxtjs/i18n"],
    runtimeConfig: {
        feedback: {
            repo: process.env.FEEDBACK_REPO,
            repoOwner: process.env.FEEDBACK_REPO_OWNER,
            project: process.env.FEEDBACK_PROJECT,
            githubToken: process.env.GITHUB_TOKEN,
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
});
