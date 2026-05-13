import type { H3Event } from "h3";
import type { SessionUser } from "#layers/auth/server/types/session";

export async function getUserSession(
    _event: H3Event,
): Promise<SessionUser | null> {
    return null;
}