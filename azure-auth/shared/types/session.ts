export interface AuthSessionUser {
    id: string;
    name: string;
    email: string;
    image?: string;
    roles: string[];
}
