import { loadNuxtConfig } from "@nuxt/kit";
import type { NuxtOptions } from "nuxt/schema";
import type { ZodObject } from "zod";

export async function generateEnvExample(): Promise<string> {
    const config = (await loadNuxtConfig({
        cwd: process.cwd(),
    })) as NuxtOptions & { env: { schemas: ZodObject[] } };
    const schemas = config.env.schemas;

    const buildTimeSchemas = schemas
        .filter((schema) => envRegistry.get(schema)?.envType === "build-time")
        .reduce<Record<string, ZodObject[]>>((acc, schema) => {
            const registry = envRegistry.get(schema);

            if (!registry) {
                throw new Error(`Schema not found in registry: ${schema}`);
            }

            if (acc[registry.group]) {
                acc[registry.group]?.push(schema);
            } else {
                acc[registry.group] = [schema];
            }

            return acc;
        }, {});

    const runtimeSchemas = schemas
        .filter((schema) => envRegistry.get(schema)?.envType === "runtime")
        .reduce<Record<string, ZodObject[]>>((acc, schema) => {
            const registry = envRegistry.get(schema);

            if (!registry) {
                throw new Error(`Schema not found in registry: ${schema}`);
            }

            if (acc[registry.group]) {
                acc[registry.group]?.push(schema);
            } else {
                acc[registry.group] = [schema];
            }

            return acc;
        }, {});

    let buildEntries = "";

    for (const [key, shapes] of Object.entries(buildTimeSchemas)) {
        buildEntries += `# ${key}`;

        for (const shape of shapes) {
            shape?.description;

            const value = shape?.default;
            const description = shape?.description;
            const comment = description ? `# ${description}` : "";

            buildEntries += `${comment}\n${key}=${value}`;
        }
    }

    let runtimeEntries = "";

    for (const [key, shapes] of Object.entries(runtimeSchemas)) {
        runtimeEntries += `# ${key}`;

        for (const shape of shapes) {
            shape?.description;

            const value = shape?.default;
            const description = shape?.description;
            const comment = description ? `# ${description}` : "";

            runtimeEntries += `${comment}\n${key}=${value}`;
        }
    }

    return `# Environment variables
# Generated from Zod schema - do not edit manually
# Run \`bun run generate:env-example\` to regenerate

# Build-time variables (required before Nuxt starts)

${buildEntries}

# Runtime variables (used during application execution)

${runtimeEntries}
`;
}
