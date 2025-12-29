export type User = {
    // Base64 user image
    image: string;
    name: string;
    email: string;
}

export type AuthData = {
    user: User;
}
