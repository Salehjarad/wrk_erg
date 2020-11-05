import { objectType, queryType, extendType, enumType } from "@nexus/schema";

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
      resolve: async (_root, _args, { prisma, req }) => {
        return await prisma.user.findOne({ where: { id: 1 } });
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

export const UserMutation = extendType({
  type: "Mutation",
  definition(t) {
    t.crud.createOneUser();
    t.crud.updateOneUser();
    t.crud.deleteOneUser();
  },
});
