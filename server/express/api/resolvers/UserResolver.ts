import UserController from '../controllers/UserController';
const UserResolver = {
    Query:{
        getAllUsers(root, args, context, info) {
            return UserController.getAllUsers(root, args);
        },
        getUserByID(root, {id}) {
            return UserController.getUserByID(root, {id});
        }
    },
    Mutation:{
        createUser(root, args) {
            return UserController.createUser(root, args);
        }
    }
}


export default UserResolver;