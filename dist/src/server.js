"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const apollo_server_express_1 = require("apollo-server-express");
const http_1 = require("http");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
// nexus schema
const schema_1 = __importDefault(require("./schema"));
// create conext for apollo server
const context_1 = require("./helpers/context");
// upload folder
const helpers_1 = require("./helpers");
const PORT = process.env.PORT || 9090;
const app = express_1.default();
// handel serveing document from the server.
app.use(cors_1.default({
    origin: "*",
}));
app.use("/docs/uploads/", express_1.default.static(helpers_1.UPLOADS_FOLDER));
app.get("/online", (req, res, next) => {
    res.json({ online: true }).status(200);
});
const server = http_1.createServer(app);
const apollo = new apollo_server_express_1.ApolloServer({
    schema: schema_1.default,
    context: context_1.createContext,
    subscriptions: {
        path: "/api/v1/",
    },
});
apollo.installSubscriptionHandlers(server);
apollo.applyMiddleware({ app, path: "/api/v1/", cors: true });
server.listen({ port: PORT }).on("listening", () => {
    console.log(`[ LIVE ] on http://localhost:9090${apollo.graphqlPath}`);
    console.log(`[ LIVE ] on ws://localhost:9090${apollo.subscriptionsPath}`);
});
//# sourceMappingURL=server.js.map