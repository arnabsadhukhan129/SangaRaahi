const UserData = require('../../data.json');
const UserController = {
    getAllUsers: function(parent, args) {
        return UserData
    },
    getUserByID: function(parent, {id}) {
        return UserData.find((u:any) => u.id === id);
    },
    createUser:  function(parent, args) {
        UserData.push({
            id:UserData.length + 1,
            firstName:args.firstName,
            lastName:args.lastName,
            email:args.email
        })
        return args
    }
};

export default UserController;