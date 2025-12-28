const DB = require('../database/db');
const fs = require('fs');
const dir = fs.readdirSync(__dirname);
const m = {};
dir.forEach(d => {
    let fn;
    if(d !== 'index.js') fn = require(`./${d}`);
    if(fn && typeof fn === 'function') m[Lib.toTitleCase(d.split(".")[0], "-")] = (fn(DB.mongoose));
});
module.exports = m;
//
// const Users = require('./users.model')(DB.mongoose);
// // Will add auto include feature
// module.exports = {
//     Users
// }