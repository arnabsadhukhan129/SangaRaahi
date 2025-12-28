// const { verifyUser } = require('./auth.middleware');
const fs = require('fs');
const dir = fs.readdirSync(__dirname);
const middleware = [];
dir.map(d => {
    if(d !== 'index.js' && d !== 'errors' && !['payment.middleware.js', 'expressVerifyUser.middleware.js'].includes(d)) {
        let m = require(`./${d}`);
        for(const [key, fn] of Object.entries(m)) {
            middleware.push({
                Query:fn,
                Mutation:fn
            });
        }
    }
});
module.exports = middleware;