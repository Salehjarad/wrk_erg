import { makeSchema } from "@nexus/schema";
import { nexusPrisma } from "nexus-plugin-prisma";
import { join } from "path";
import * as types from "./models/";

const schema = makeSchema({
  types,
  plugins: [nexusPrisma({ experimentalCRUD: true })],
  outputs: {
    schema: join(__dirname, "..", "schema.graphql"),
    typegen: join(__dirname, ".", "generated", "nexus.ts"),
  },
  typegenAutoConfig: {
    contextType: "Context.Context",
    sources: [
      {
        source: "@prisma/client",
        alias: "prisma",
      },
      {
        source: require.resolve("./helpers/context"),
        alias: "Context",
      },
    ],
  },
});

export default schema;
