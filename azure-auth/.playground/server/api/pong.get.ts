export default defineEventHandler((event) => {
    const auth = getRequestHeader(event, "Authorization");

    return { message: "pong", auth: auth || null };
});
