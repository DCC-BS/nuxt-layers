const SENSITIVE_FIELDS = [
    "clientSecret",
    "secret",
    "password",
    "token",
    "accessToken",
    "refreshToken",
    "apiKey",
    "authorization",
    "credential",
    "privateKey",
];

function sanitizeObject(obj: unknown, depth = 0): unknown {
    if (depth > 5 || !obj || typeof obj !== "object") {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map((item) => sanitizeObject(item, depth + 1));
    }

    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
        const lowerKey = key.toLowerCase();
        if (
            SENSITIVE_FIELDS.some((field) =>
                lowerKey.includes(field.toLowerCase()),
            )
        ) {
            sanitized[key] = "[REDACTED]";
        } else {
            sanitized[key] = sanitizeObject(value, depth + 1);
        }
    }
    return sanitized;
}

export default defineNitroPlugin((nitroApp) => {
    nitroApp.hooks.hook("error", async (error) => {
        const h3Error = error as Error & { data?: { originalError?: unknown } };
        if (h3Error.data?.originalError) {
            h3Error.data.originalError = sanitizeObject(
                h3Error.data.originalError,
            );
        }
    });
});
