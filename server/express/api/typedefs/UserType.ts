const UserType = `
    type User {
        id: Int,
        firstName: String,
        lastName: String,
        email: String,
    }


    type Query{
        getAllUsers: [User],
        getUserByID(id: Int): User
    }

    type Mutation {
        createUser(firstName: String, lastName: String, email: String): User
    }
`
export default UserType