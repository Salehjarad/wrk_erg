import {
  objectType,
  queryType,
  extendType,
  enumType,
  stringArg,
  subscriptionField,
} from "@nexus/schema";
import { withFilter } from "apollo-server-express";

import bcrypt from "bcryptjs";

export const Role = enumType({
  name: "Role",
  members: ["ROOT", "ADMIN", "USER", "VIEWER"],
});

export const User = objectType({
  name: "User",
  definition(t) {
    t.model.id();
    t.model.username();
    t.model.email();
    t.model.fname();
    t.model.lname();
    t.model.rule();
    t.model.docs({ type: "Document" });
    t.model.created_at();
    t.model.updated_at();
  },
});

export const MeQuery = queryType({
  definition(t) {
    t.field("me", {
      type: "User",
      resolve: async (_root, _args, { prisma, req, userId }) => {
        const id: any = await userId(req);
        return await prisma.user.findOne({ where: { id } });
      },
    });
  },
});

export const UserLogin = extendType({
  type: "Query",
  definition(t) {
    t.field("login", {
      type: "UserPayload",
      args: {
        username: stringArg({ required: true }),
        password: stringArg({ required: true }),
      },
      resolve: async (_root, args, { prisma, makeToken, pubsub }) => {
        const { username, password } = args;
        const user = await prisma.user.findOne({ where: { username } });
        if (!user) {
          throw new Error("user not found");
        }
        const isValidPassword = await bcrypt.compareSync(
          password,
          user.password
        );
        if (!isValidPassword) {
          throw new Error("password no match");
        }
        const token = await makeToken(user.id);
        await pubsub.publish("LIVE_USER", `${user.username} online`);
        return { user, token };
      },
    });
  },
});

export const UsersQuery = extendType({
  type: "Query",
  definition(t) {
    t.crud.users();
  },
});

export const CreatUserType = objectType({
  name: "UserPayload",
  definition(t) {
    t.field("user", { type: "User" }), t.string("token");
    t.string("token");
  },
});

export const createNewUser = extendType({
  type: "Mutation",
  definition(t) {
    t.field("createNewUser", {
      type: "UserPayload",
      args: {
        username: stringArg({ required: true }),
        email: stringArg({ required: true }),
        password: stringArg({ required: true }),
      },
      resolve: async (_root, args, { prisma, makeToken }) => {
        const { username, email, password } = args;
        const hashedPass = await bcrypt.hashSync(password, 10);
        const user = await prisma.user.create({
          data: {
            username,
            email,
            password: hashedPass,
          },
        });
        const token = await makeToken(user?.id);
        return { user, token };
      },
    });
  },
});

export const UserMutation = extendType({
  type: "Mutation",
  definition(t) {
    t.crud.updateOneUser();
    t.crud.deleteOneUser();
  },
});

export const UserSubcribation = subscriptionField("live", {
  type: "String",
  subscribe: async (_root, args, { pubsub }) => {
    return pubsub.asyncIterator(["LIVE_USER"]);
  },
  resolve: (payload: any) => {
    return payload;
  },
});
