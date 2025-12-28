const fs = require('fs');
/**
 * We are not using the gql 
 * As we are using the graphql-tools to create the schema.
 * So the gql is not required. but we are still passing it if there is any requirement in the future.
 */
module.exports = function(gql) {
    const dir = fs.readdirSync(__dirname);
    const queries = [];
     dir.map(d => {
        if(d !== 'index.js') queries.push(require(`./${d}`)(gql));
    });
    // retrun as the array
    return queries;
}