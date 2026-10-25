import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

function layer(name: string): string {
    return fileURLToPath(new URL(`./${name}`, import.meta.url));
}

export default defineConfig({
    // Needs `nuxt prepare .playground` in every layer first (mise run layers:prepare): the layers'
    // tsconfig.json files extend the generated `.playground/.nuxt/tsconfig.json`.
    resolve: {
        alias: {
            "#layers/logger": layer("logger"),
            "#layers/pino-logger": layer("pino-logger"),
            "#layers/auth": layer("auth"),
        },
    },
    test: {
        include: ["tests/**/*.test.ts"],
        // The e2e suite builds the fixture app once; give it time.
        hookTimeout: 300_000,
        testTimeout: 30_000,
    },
});
