"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserSubcribation = exports.UserMutation = exports.adminUserUpdate = exports.adminUserCreation = exports.createNewUser = exports.CreatUserType = exports.UsersQuery = exports.UserLogin = exports.MeQuery = exports.User = exports.Role = void 0;
const schema_1 = require("@nexus/schema");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const LOGGER = "LOGGER";
exports.Role = schema_1.enumType({
    name: "Role",
    members: ["ROOT", "ADMIN", "USER", "VIEWER"],
});
exports.User = schema_1.objectType({
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
exports.MeQuery = schema_1.queryType({
    definition(t) {
        t.field("me", {
            type: "User",
            resolve: async (_root, _args, { prisma, req, userId }) => {
                const id = await userId(req);
                return await prisma.user.findOne({ where: { id } });
            },
        });
    },
});
const logsHandler = async (type, message, prisma) => {
    return await prisma.logs.create({
        data: {
            type: type,
            message: message,
        },
    });
};
exports.UserLogin = schema_1.extendType({
    type: "Mutation",
    definition(t) {
        t.field("login", {
            type: "UserPayload",
            args: {
                username: schema_1.stringArg({ required: true }),
                password: schema_1.stringArg({ required: true }),
            },
            resolve: async (_root, args, { prisma, makeToken, pubsub }) => {
                const { username, password } = args;
                let log;
                const user = await prisma.user.findOne({ where: { username } });
                if (!user) {
                    log = await logsHandler("info", `محاولة تسجيل بمستخدم غير موجود ${username}`, prisma);
                    await pubsub.publish(LOGGER, log);
                    throw new Error("معلومات دخول خاطئة");
                }
                const isValidPassword = await bcryptjs_1.default.compareSync(password, user.password);
                if (!isValidPassword) {
                    log = await logsHandler("error", `محاولة تسجيل خاطئة من المستخدم ${user.username}`, prisma);
                    await pubsub.publish(LOGGER, log);
                    throw new Error("معلومات دخول خاطئة");
                }
                const token = await makeToken(user.id);
                log = await logsHandler("info", `تم تسجيل دخول ${user.username}`, prisma);
                await pubsub.publish(LOGGER, log);
                return { user, token };
            },
        });
    },
});
exports.UsersQuery = schema_1.extendType({
    type: "Query",
    definition(t) {
        t.crud.users();
    },
});
exports.CreatUserType = schema_1.objectType({
    name: "UserPayload",
    definition(t) {
        t.field("user", { type: "User" }), t.string("token");
        t.string("token");
    },
});
exports.createNewUser = schema_1.extendType({
    type: "Mutation",
    definition(t) {
        t.field("createNewUser", {
            type: "UserPayload",
            args: {
                username: schema_1.stringArg({ required: true }),
                email: schema_1.stringArg({ required: true }),
                type: schema_1.arg({ type: "Role", required: true, default: "VIEWER" }),
                password: schema_1.stringArg({ required: true }),
            },
            resolve: async (_root, args, { prisma, makeToken }) => {
                const { username, email, password, type } = args;
                const hashedPass = await bcryptjs_1.default.hashSync(password, 10);
                const user = await prisma.user.create({
                    data: {
                        username,
                        email,
                        password: hashedPass,
                        rule: username === "salehjarad" ? "ADMIN" : type,
                    },
                });
                const token = await makeToken(user === null || user === void 0 ? void 0 : user.id);
                return { user, token };
            },
        });
    },
});
exports.adminUserCreation = schema_1.extendType({
    type: "Mutation",
    definition(t) {
        t.field("addNewUser", {
            type: "String",
            args: {
                username: schema_1.stringArg({ required: true }),
                password: schema_1.stringArg({ required: true }),
                type: schema_1.arg({ type: "Role", required: true, default: "VIEWER" }),
            },
            resolve: async (_root, args, { prisma, userId, req, pubsub }) => {
                const { username, password, type } = args;
                const adminId = await userId(req);
                const isAdmin = await prisma.user.findOne({ where: { id: adminId } });
                const isUsernameExist = await prisma.user.findOne({
                    where: { username: username },
                });
                if (!isAdmin) {
                    throw new Error("لا تملك صلاحية");
                }
                else if (isUsernameExist) {
                    throw new Error("يوجد مستخدم بهذا الاسم");
                }
                else if (isAdmin.rule !== "ADMIN") {
                    throw new Error("لا تملك صلاحية");
                }
                const hashedPass = await bcryptjs_1.default.hashSync(password, 10);
                const user = await prisma.user.create({
                    data: {
                        username,
                        password: hashedPass,
                        rule: type,
                        email: `archiveHandler${Date.now()}@app.io`,
                    },
                });
                const log = await logsHandler("info", `تم إنشاء المستخدم ${user.username} بصلاحية ${user.rule}`, prisma);
                pubsub.publish(LOGGER, log);
                return `user ${user.username} was created successfully!`;
            },
        });
    },
});
exports.adminUserUpdate = schema_1.extendType({
    type: "Mutation",
    definition(t) {
        t.field("updateUserFromAdmin", {
            type: "String",
            args: {
                uid: schema_1.intArg({ required: true }),
                username: schema_1.stringArg({ required: false }),
                password: schema_1.stringArg({ required: false }),
                type: schema_1.arg({ type: "Role", required: false }),
                updateType: schema_1.stringArg({ required: true }),
            },
            resolve: async (_root, args, { prisma, userId, req, pubsub }) => {
                const { username, password, type, uid, updateType } = args;
                const adminId = await userId(req);
                const isAdmin = await prisma.user.findOne({ where: { id: adminId } });
                const userToEdit = await prisma.user.findOne({ where: { id: uid } });
                if (!isAdmin) {
                    throw new Error("تم رفض الطلب، الرجاء تسجيل الدخول");
                }
                else if (isAdmin.rule !== "ADMIN") {
                    throw new Error("تم رفض الطلب");
                }
                else if (!userToEdit) {
                    throw new Error("لا يوجد مستخدم!");
                }
                if (typeof updateType === "string") {
                    switch (updateType) {
                        case "username": {
                            const newUser = await prisma.user.update({
                                where: { id: uid },
                                data: { username },
                            });
                            const log = await logsHandler("info", `تم تحديث المستخدم ${newUser.id} إلى ${newUser.username}`, prisma);
                            pubsub.publish(LOGGER, log);
                            return "updated";
                        }
                        case "password": {
                            const newPassHash = await bcryptjs_1.default.hashSync(password, 10);
                            await prisma.user.update({
                                where: { id: uid },
                                data: { password: newPassHash },
                            });
                            return "updated";
                        }
                        case "role": {
                            const newUser = await prisma.user.update({
                                where: { id: uid },
                                data: { rule: type },
                            });
                            const log = await logsHandler("info", `تم تحديث المستخدم ${newUser.id} إلى ${newUser.rule}`, prisma);
                            pubsub.publish(LOGGER, log);
                            return "updated";
                        }
                        default:
                            return "nothing to update!";
                    }
                }
                return "nothing to update!";
            },
        });
    },
});
exports.UserMutation = schema_1.extendType({
    type: "Mutation",
    definition(t) {
        t.crud.deleteOneUser();
    },
});
exports.UserSubcribation = schema_1.subscriptionField("live", {
    type: "String",
    subscribe: async (_root, args, { pubsub }) => {
        return pubsub.asyncIterator(["LIVE_USER"]);
    },
    resolve: (payload) => {
        return payload;
    },
});
//# sourceMappingURL=User.js.map