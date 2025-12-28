// /***************** *******************
//  * Author: MatrixMedia
//  * File: server.js
//  * Purpose: Main server initialize (entry point of the API)
//  ***************** *******************/

// /**
//  * PACKAGE IMPORTS
//  */
require('dotenv').config();
const express = require('express');
const http = require('http');
const https = require('https');
const fs = require('fs');
const { ApolloServer, gql } = require('apollo-server-express');
const { mergeGraphQLTypes, mergeResolvers } = require('@graphql-tools/merge');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { applyMiddleware } = require('graphql-middleware');
const i18n = require("i18n");
const bodyParser = require('body-parser');
const socket = require('./app/connectors/socket.connector.js');
const cors=require('cors');
const axios = require('axios');

// Load all the library functions
global.Lib = require('./app/library/library');

// For only development ease
global.clog = function(...message) {
    if(Lib.isDevEnv()) {
        console.log(...message);
    }
}

// Get the Queries & Mutation type and merge them together for the schema
const Query = mergeGraphQLTypes(require('./app/queries')(gql));

// Get the resolvers array and merge them together for the schema
const Resolvers = mergeResolvers(require('./app/resolvers'));

// Get all the middlewares
const Middlewares = require('./app/middlewares');
const logger = require('./app/library/logger');

// Create an executable schema with the middlewares
const schema = makeExecutableSchema({ typeDefs: Query, resolvers: Resolvers });
const schemaWithMiddleware = applyMiddleware(schema, ...Middlewares);

// Initiate the express app
const app = express();
// app.use(morgan(':method :url :status :res[content-length] - :response-time ms'))
app.use(bodyParser.json());

app.use("/public", express.static('public'))
app.use(cors());
/**
 * Initialize the i18n middleware
 */
i18n.configure({
    locales: ['hi', 'bn', 'en'],
    defaultLocale: 'en',
    autoReload: true,
    directory: __dirname + '/app/languages',
    syncFiles: true,
    fallbackLng: "en",
});
app.use(i18n.init);
app.use(function (req, res, next) {
    res.removeHeader('X-Powered-By');
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, x-uid");
    res.setHeader("Content-Security-Policy", "script-src 'self' https://apis.google.com");
    i18n.setLocale(req.headers["accept-language"] || 'en');
    next();
});
app.get('/', (req, res) => {
    res.send("API is running....")
});
app.get('/docs', (req, res) => {
    res.sendFile(`${__dirname}/public/index.html`);
});
// Register the routes
app.use('/api', require('./app/routes/routes.js'));
app.use('/api/payment', require('./app/routes/payment.routes.js'));
app.use('/api/socket', require('./app/routes/auth.routes.js'));
app.use('/api/upload', require('./app/routes/upload.routes.js'));

app.get('/.well-known/assetlinks.json', async (req, res) => {
    try {
        // Fetch the assetlinks.json file from the external URL
        const response = await axios.get("https://sangaraahi.net/.well-known/assetlinks.json");

        // Set content type to application/json
        res.setHeader('Content-Type', 'application/json');

        // Send the file content as JSON response
        res.send(response.data);
    } catch (error) {
        console.error("Error fetching assetlinks.json:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
});
/**
 * Initiating the Apollo server
 */

// Create the HTTP or HTTPS server
const CA_FILES = process.env.CA_FILES ? (typeof process.env.CA_FILES === 'string' ? JSON.parse(process.env.CA_FILES) : process.env.CA_FILES) : [];
let httpServer;
if (process.env.SSL_ENABLE !== 'true') {
    httpServer = http.createServer(app);
} else {
    httpServer = https.createServer({
        key: fs.readFileSync(process.env.KEY_FILE, 'utf-8'),
        cert: fs.readFileSync(process.env.CERT_FILE, 'utf-8'),
        ca: CA_FILES.map(c => fs.readFileSync(c)),
        requestCert: true,
        rejectUnauthorized: false
    }, app);
}

// Create the Apollo Server and pass `io` into the context
const server = new ApolloServer({
    schema: schemaWithMiddleware,
    introspection: true,
    persistedQueries: false,
    context: ({ req, res }) => {
        return { req, res, lang: Lib.getLocale(req)};
    },
    formatError: err => {
        if (!Lib.isDevEnv()) logger.info(err);
        if (Lib.isDevEnv()) console.log(err);

        let message = err.originalError && err.originalError.message;
        if (message && Lib.isLangKey(message)) {
            message = Lib.translate(message);
        }
        return {
            error: true,
            message: message || "Internal Server Error",
            code: err.originalError ? (err.originalError.code || 500) : 500,
            systemCode: err.originalError ? err.originalError.statusCode : "",
            data: null,
            stack: err.originalError && err.originalError.stack ? err.originalError.stack : err.stack
        };
    },
    formatResponse(response, requestContext) {
        if (response.errors && response.errors.length > 0) {
            const operationName = Object.keys(response.data);
            response.data[operationName] = response.errors[0];
            delete response.errors;
        }
        return response;
    }
});

server.start().then(() => {
    server.applyMiddleware({ app, path: '/graphql' });
    httpServer.listen(Lib.ENV('PORT', 5066), () => {
        console.log(`Apollo Server is running on ${Lib.ENV('PORT', 5066)}. SSL:-> ${process.env.SSL_ENABLE==='true'}`);
    });
}).catch(err => {
    console.log("Could not start the apollo server", err);
});
