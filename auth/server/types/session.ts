export type SessionUser = {
    email: string;
    name: string;
    image?: string;

    [key: string]: unknown;
};