export type User = {
    // Base64 user image
    image: string;
    name: string;
    email: string;

    [key: string]: unknown;
};

export type AuthData = {
    user: User;
};
