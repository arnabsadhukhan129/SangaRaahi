const fs = require('fs');
const dir = fs.readdirSync(__dirname);
const resolvers = [];
//const{GraphQLUpload} = require('graphql-upload');
dir.map(d => {
    // include all the resolvers except the index.js
    if(d !== 'index.js') resolvers.push(require(`./${d}`));
});
module.exports = resolvers;