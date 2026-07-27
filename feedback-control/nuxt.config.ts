import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    compatibilityDate: '2026-07-27',
    $meta: {
        name: "feedback-control",
    },
    css: [join(currentDir, "./app/assets/main.css")],
    devtools: { enabled: true },
    modules: ["@nuxt/ui", "@nuxtjs/i18n"],
    runtimeConfig: {
        feedback: {
            repo: process.env.FEEDBACK_REPO,
            repoOwner: process.env.FEEDBACK_REPO_OWNER,
            project: process.env.FEEDBACK_PROJECT,
            githubToken: process.env.FEEDBACK_GITHUB_TOKEN,
        },
    },
    i18n: {
        defaultLocale: "en",
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
