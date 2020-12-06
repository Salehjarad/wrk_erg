"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogsSub = exports.LogsQuery = exports.Logs = void 0;
const schema_1 = require("@nexus/schema");
exports.Logs = schema_1.objectType({
    name: "Logs",
    definition(t) {
        t.model.id();
        t.model.type();
        t.model.message();
        t.model.created_at();
    },
});
exports.LogsQuery = schema_1.extendType({
    type: "Query",
    definition(t) {
        t.list.field("logs", {
            type: "Logs",
            nullable: true,
            resolve: async (_root, _args, { prisma, req, userId, logger }) => {
                const uid = await userId(req);
                const user = await prisma.user.findOne({ where: { id: uid } });
                try {
                    if ((user === null || user === void 0 ? void 0 : user.rule) !== "ADMIN") {
                        logger.error(`user ${user === null || user === void 0 ? void 0 : user.username} tried to get logs`);
                        return null;
                    }
                    return await prisma.logs.findMany({});
                }
                catch (error) {
                    logger.error("get logs", error);
                    return null;
                }
            },
        });
    },
});
exports.LogsSub = schema_1.subscriptionField("logger", {
    type: "Logs",
    subscribe: async (_root, _args, { pubsub }) => {
        return await pubsub.asyncIterator("LOGGER");
    },
    resolve: (payload) => payload,
});
//# sourceMappingURL=Logs.js.map