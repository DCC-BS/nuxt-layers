import { defineEventHandler } from "h3";
import type { AuthSessionUser } from "#layers/azure-auth/shared/types/session";
import { AuthSessionPayload } from "../../types/authTypes";
import { jwtVerify } from "jose/jwt/verify";
import { getGraphQlAccessToken } from "../../utils/authUtils";

export default defineEventHandler(async (event) => {
    const logger = getEventLogger(event);
    const session = await getServerSession(event);

    if (!session?.user) {
        return null;
    }

    let imageUrl: string | undefined;


    try {
        const graphQlAccessToken = await getGraphQlAccessToken(event);

        const imageBlob = await $fetch<Blob>(
            "https://graph.microsoft.com/v1.0/me/photos/48x48/$value",
            {
                headers: {
                    Authorization: `Bearer ${graphQlAccessToken}`,
                    "Content-Type": "image/jpeg",
                },
            },
        );

        // base64 encode the image blob
        const arrayBuffer = await imageBlob.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString("base64");
        imageUrl = `data:image/jpeg;base64,${base64}`;
    } catch (error) {
        logger.warn(error, "Error fetching user image from Microsoft Graph");
    }

    return { ...session.user, image: imageUrl } as AuthSessionUser;
});
