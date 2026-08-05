import { defineEventHandler } from "h3";
import type { AuthSessionUser } from "#layers/azure-auth/shared/types/session";
import { getGraphQlAccessToken } from "../../utils/authUtils";

export default defineEventHandler(async (event) => {
    const session = await getServerSession(event);

    if (!session?.user) {
        return null;
    }

    let imageUrl: string | undefined;

    const graphQlAccessToken = await getGraphQlAccessToken(event);

    if (graphQlAccessToken) {
        try {
            const imageBlob = await $fetch<Blob>(
                "https://graph.microsoft.com/v1.0/me/photos/48x48/$value",
                {
                    headers: {
                        Authorization: `Bearer ${graphQlAccessToken}`,
                        "Content-Type": "image/jpeg",
                    },
                },
            );

            const arrayBuffer = await imageBlob.arrayBuffer();
            const base64 = Buffer.from(arrayBuffer).toString("base64");
            imageUrl = `data:image/jpeg;base64,${base64}`;
        } catch {
            // Profile photo is best-effort (e.g. user has no photo, or Graph returns 4xx).
            // Silently fall back to no image rather than noisily logging.
        }
    }

    return { ...session.user, image: imageUrl } as AuthSessionUser;
});
