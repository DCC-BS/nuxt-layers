import { defineEventHandler } from "h3";

export default defineEventHandler(async (event): Promise<AuthSession | null> => {
    return await getServerSession(event);
});
