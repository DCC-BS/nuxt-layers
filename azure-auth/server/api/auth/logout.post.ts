import { defineEventHandler, deleteCookie } from "h3";

const SESSION_COOKIE_NAME = "auth_session";

export default defineEventHandler(async (event) => {
    deleteCookie(event, SESSION_COOKIE_NAME, {
        path: "/",
    });

    return { success: true };
});
