export type User = {
    id: string;
    name: string;
    email: string;
}

export type Query = {
    getAllUsers: User[];
}
