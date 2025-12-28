const mongoose = require('mongoose');
const Lib = require('../library/library');
const logger = require('../library/logger');
try {
    const HOST = Lib.ENV('DB_HOST');
    const PORT = Lib.ENV('DB_PORT');
    const DB = Lib.ENV('DB_NAME');
    const DB_CLUSTER = Lib.ENV('DB_CLUSTER');
    const USERNAME = Lib.ENV('DB_USERNAME');
    const PASSWORD = Lib.ENV('DB_PASSWORD');
    const MAX_POOL_SIZE = Lib.ENV('MAX_POOL_SIZE');
    const MIN_POOL_SIZE = Lib.ENV('MIN_POOL_SIZE');
    const SOCKET_TIMEOUT_MS = Lib.ENV('SOCKET_TIMEOUT_MS');
    let DB_HOST = ''; const OPTIONS = {
        maxPoolSize: MAX_POOL_SIZE,
        minPoolSize: MIN_POOL_SIZE,
        socketTimeoutMS: SOCKET_TIMEOUT_MS,
    };
    /**
     * If development environment then use the Atlas DB
     */
    if(!Lib.isForceNormalConnection()) {
        console.log("this one", HOST)
        DB_HOST = HOST.replace(new RegExp('<username>'), USERNAME)
        .replace(new RegExp('<password>'), PASSWORD)
        .replace(new RegExp('<cluster>'), DB_CLUSTER)
        .replace(new RegExp('<dbname>'), DB);
        OPTIONS['useNewUrlParser'] = true;
        OPTIONS['useUnifiedTopology'] = true;
    } else if(Lib.isForceNormalConnection()){
        // If the production environment then use the production db that is set in env
        DB_HOST = `mongodb://${HOST}:${PORT}/${DB}`;
        OPTIONS['user'] = USERNAME;
        OPTIONS['pass'] = PASSWORD;
        OPTIONS['useNewUrlParser'] = true;
        OPTIONS['useUnifiedTopology'] = true;
    }
    console.log(DB_HOST, "DB_HOST....");
    mongoose.connect(DB_HOST, OPTIONS).then(success => {
        console.log("MONGO PROMISE SUCCESS");
    }).catch(e => {
        console.log("MONGO NOT CONNECTED", e);
    });
    const mongoDB = mongoose.connection;
    mongoDB.on("open", () => {
        console.log("MONGO DB CONNECTED");
    });
    mongoDB.on('error',  (error) => {
        console.log(error);
    })
    mongoose.set('debug',true)
    module.exports = {mongoDB, mongoose};
}catch(e) {
    console.log("==============MONGO ERROR================");
    // console.log(e);
    throw new Error(e);
}