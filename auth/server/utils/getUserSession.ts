import type { H3Event } from "h3";
import type { SessionUser } from "../types/session";

export async function getUserSession(
    _event: H3Event,
): Promise<SessionUser | null> {
    console.warn(
        "getUserSession: No auth implementation loaded. Returning null.",
    );
    return null;
}