import { ZodObject } from "zod";

export default defineNitroPlugin(() => {
    const config = useRuntimeConfig();
    const schemas = config.env.schemas as ZodObject[];

    for (const schema of schemas) {
        if(envRegistry.get(schema)?.envType === "build-time") {
            return;
        }

        const envObjs = process.env;

        const result = schema.safeParse(envObjs);

        if (!result.success) {
            result.error.issues.forEach((issue) => {
                console.error(`Validation error for env variable: ${issue.path.join(".")}`);
                console.error(`Error message: ${issue.message}`);
            });
        }
    }
});
