import type { H3Event } from "h3";
import type { SessionUser } from "#layers/auth/server/types/session";
import { getServerSession } from "./authUtils";

export async function getUserSession(
    event: H3Event,
): Promise<SessionUser | null> {
    const session = await getServerSession(event);

    if (!session?.user) {
        return null;
    }

    return {
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
        id: session.user.id,
        roles: session.user.roles,
    };
}