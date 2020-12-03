import { ApolloServer } from "apollo-server-express";
import { createServer } from "http";
import express, { Application } from "express";
import { resolve } from "path";
import cors from "cors";
// nexus schema
import schema from "./schema";

// create conext for apollo server
import { createContext } from "./helpers/context";

// upload folder
import { UPLOADS_FOLDER } from "./helpers";

const PORT = process.env.PORT || 9090;
const app: Application = express();

// handel serveing document from the server.

app.use(
  cors({
    origin: "*",
  })
);

app.use("/docs/uploads/", express.static(UPLOADS_FOLDER));

app.get("/online", (req, res, next) => {
  res.json({ online: true }).status(200);
});
const server = createServer(app);
const apollo = new ApolloServer({
  schema,

  context: createContext,
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
