// Specify the error modules here
const fs = require('fs');

const dir = fs.readdirSync(__dirname);
//console.log("dirname",dir);
const errors = {};
dir.forEach(d => {
    //console.log(d);
    if(d !== 'httperrorcode.js' && d !== 'index.js') {
        errors[Lib.getKeyNameFromFile(d)] = require(`./${d}`);
    }
});

module.exports = errors;