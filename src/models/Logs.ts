import { objectType, extendType, subscriptionField } from "@nexus/schema";

export const Logs = objectType({
  name: "Logs",
  definition(t) {
    t.model.id();
    t.model.type();
    t.model.message();
    t.model.created_at();
  },
});

export const LogsQuery = extendType({
  type: "Query",
  definition(t) {
    t.list.field("logs", {
      type: "Logs",
      nullable: true,
      resolve: async (_root, _args, { prisma, req, userId, logger }) => {
        const uid = await userId(req);
        const user = await prisma.user.findOne({ where: { id: uid } });
        try {
          if (user?.rule !== "ADMIN") {
            logger.error(`user ${user?.username} tried to get logs`);
            return null;
          }

          return await prisma.logs.findMany({});
        } catch (error) {
          logger.error("get logs", error);
          return null;
        }
      },
    });
  },
});

export const LogsSub = subscriptionField("logger", {
  type: "Logs",
  subscribe: async (_root, _args, { pubsub }) => {
    return await pubsub.asyncIterator("LOGGER");
  },
  resolve: (payload) => payload,
});
