"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createContext = void 0;
const client_1 = require("@prisma/client");
const usertoken_1 = require("./usertoken");
const apollo_server_express_1 = require("apollo-server-express");
const log4js_1 = require("log4js");
const path_1 = require("path");
log4js_1.configure(path_1.join(__dirname, "../log4js.json"));
const prisma = new client_1.PrismaClient();
const pubsub = new apollo_server_express_1.PubSub();
const logger = log4js_1.getLogger();
function createContext({ req }) {
    return {
        prisma,
        req,
        userId: usertoken_1.userId,
        makeToken: usertoken_1.makeToken,
        pubsub,
        logger,
    };
}
exports.createContext = createContext;
//# sourceMappingURL=context.js.map