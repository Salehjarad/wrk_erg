"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentCountSub = exports.DocumentSubscrbtion = exports.DocumentSubscrbtionType = exports.DocumentSearchQuery = exports.DocumentQuery = exports.DeleteDocument = exports.UpdateDocumentByAdminAndUser = exports.DocumetUpdateByAdminInput = exports.CreateDocument = exports.CreateDocumentResponse = exports.ResponseError = exports.TagsInput = exports.DocSize = exports.Document = void 0;
const schema_1 = require("@nexus/schema");
const utils_1 = require("../utils");
const helpers_1 = require("../helpers");
const enums_1 = require("../helpers/enums");
const fs_1 = require("fs");
const path_1 = require("path");
const enums_2 = require("../helpers/enums");
const deleteFileSync = async (path) => {
    if (await fs_1.existsSync(path)) {
        await fs_1.unlinkSync(path);
    }
};
const LOGGER = "LOGGER";
const logsHandler = async (type, message, prisma) => {
    return await prisma.logs.create({
        data: {
            type: type,
            message: message,
        },
    });
};
exports.Document = schema_1.objectType({
    name: "Document",
    definition(t) {
        t.model.id();
        t.model.content();
        t.model.doc_number();
        t.model.doc_date();
        t.model.doc_type();
        t.model.file_url();
        t.model.user();
        t.model.userId();
        t.model.tags({ type: "Tag" });
        t.model.folder_name();
        t.model.filename();
        t.model.attachment({ type: "Attachment" });
    },
});
exports.DocSize = schema_1.extendType({
    type: "Query",
    definition(t) {
        t.field("doc_count", {
            type: "Int",
            nullable: true,
            resolve: async (_root, _args, { prisma }) => {
                return prisma.document.count({});
            },
        });
    },
});
exports.TagsInput = schema_1.inputObjectType({
    name: "TagInput",
    definition(t) {
        t.list.string("value", { required: true });
    },
});
exports.ResponseError = schema_1.objectType({
    name: "ResponseError",
    definition(t) {
        t.string("field");
        t.string("message");
    },
});
exports.CreateDocumentResponse = schema_1.objectType({
    name: "CreateDocumentResponse",
    definition(t) {
        t.field("document", { type: "Document", nullable: true }),
            t.list.field("errors", { type: "ResponseError", nullable: true });
    },
});
exports.CreateDocument = schema_1.extendType({
    type: "Mutation",
    definition(t) {
        t.field("createDocument", {
            type: "CreateDocumentResponse",
            nullable: false,
            args: {
                content: schema_1.stringArg({ required: true }),
                doc_number: schema_1.stringArg({ required: true }),
                doc_date: schema_1.stringArg({ required: true }),
                doc_type: schema_1.stringArg({ required: true }),
                doc_folder: schema_1.stringArg({ required: true, default: "عام" }),
                hashtag: schema_1.arg({
                    type: "TagInput",
                    required: true,
                    default: { value: ["new"] },
                }),
                file: schema_1.arg({ type: "Upload", required: false }),
            },
            resolve: async (_root, args, { prisma, req, pubsub, userId, logger }) => {
                let errors = [];
                let pathone = "";
                const uid = await userId(req);
                const { content, doc_date, doc_number, hashtag, doc_type, file, doc_folder, } = args;
                try {
                    const user = await prisma.user.findOne({ where: { id: uid } });
                    const oldDocument = await prisma.document.findOne({
                        where: { doc_number: doc_number },
                    });
                    if (!user || user.rule === "VIEWER") {
                        errors = [{ field: "user", message: "غير مسموح" }];
                        return { document: null, errors: errors };
                    }
                    if (oldDocument) {
                        errors = [
                            ...errors,
                            { field: "doc_number", message: "يوجد ملف بهذا الرقم مسبقاً" },
                        ];
                        const log = logsHandler("error", `محاولة إدخال ملف موجود مسبقاً من المستخدم ${user.username}`, prisma);
                        pubsub.publish(LOGGER, log);
                        return { document: null, errors: errors };
                    }
                    if (!file) {
                        errors = [
                            ...errors,
                            { field: "doc_info", message: "يجب إرفاق ملف" },
                        ];
                        const log = logsHandler("error", `محاولة إدخال ملف دون إرفاقه من المستخدم ${user.username}`, prisma);
                        pubsub.publish(LOGGER, log);
                        return { document: null, errors: errors };
                    }
                    const { createReadStream, filename, mimetype } = await file;
                    // console.log("file", file.filename);
                    logger.info("name", filename);
                    const file_extention = path_1.extname(filename);
                    const tempNameForNow = `${Date.now()}${file_extention}`;
                    const didUploadFile = await utils_1.upload_proccessing({
                        stream: createReadStream(),
                        filename: tempNameForNow,
                        mimetype,
                        foldername: doc_folder,
                    });
                    if (didUploadFile) {
                        pathone = `${req.protocol}://${req.headers.host}/docs/uploads/${didUploadFile.filename}`;
                    }
                    const exist_tags = await prisma.tag.findMany({});
                    const tags = await helpers_1.TagClean(hashtag, exist_tags);
                    const newPost = await prisma.document.create({
                        data: {
                            content,
                            doc_number,
                            doc_date,
                            doc_type,
                            folder_name: doc_folder,
                            filename: tempNameForNow,
                            file_url: pathone,
                            user: {
                                connect: {
                                    id: uid,
                                },
                            },
                            tags,
                        },
                    });
                    await pubsub.publish("count", await prisma.document.count({}));
                    await pubsub.publish(enums_1.DocumentPost.DOC_CHANNEL, {
                        mutation: enums_1.DocumentPost.ADDED,
                        doc: newPost,
                    });
                    const log = logsHandler("info", `تم إدخال الملف رقم ${newPost.doc_number} بنجاح من المستخدم ${user.username}`, prisma);
                    pubsub.publish(LOGGER, log);
                    logger.warn("document id", newPost.doc_number);
                    return { document: newPost, errors: null };
                }
                catch (error) {
                    logger.error(error);
                    const log = logsHandler("error", `خطاء في إدخال الملف رقم ${doc_number}: ${error.message}`, prisma);
                    pubsub.publish(LOGGER, log);
                    return {
                        document: null,
                        errors: [{ field: "error type", message: "يوجد خطاء عام" }],
                    };
                }
            },
        });
    },
});
exports.DocumetUpdateByAdminInput = schema_1.inputObjectType({
    name: "DocumentUpdatedByAdminInput",
    definition(t) {
        t.string("content", { required: false });
        t.string("doc_number", { required: false });
        t.string("doc_date", { required: false });
    },
});
exports.UpdateDocumentByAdminAndUser = schema_1.extendType({
    type: "Mutation",
    definition(t) {
        t.field("updateDocument", {
            type: "String",
            nullable: true,
            args: {
                doc_id: schema_1.intArg({ required: true }),
                data: schema_1.arg({ type: "DocumentUpdatedByAdminInput" }),
            },
            resolve: async (_root, args, { prisma, userId, req, pubsub }) => {
                const { doc_id, data } = args;
                const uid = await userId(req);
                const userWhoUpdate = await prisma.user.findOne({ where: { id: uid } });
                if (!userWhoUpdate) {
                    throw new Error("لا يوجد مستخدم مفعل لإتمام هذه العملية");
                }
                else if (userWhoUpdate.rule === "VIEWER") {
                    throw new Error("لا تملك هذه الصلاحيه الرجاء الاتصال بالمسؤول");
                }
                if (data === null || data === void 0 ? void 0 : data.doc_number) {
                    const isDocNumberExist = await prisma.document.findOne({
                        where: { doc_number: data === null || data === void 0 ? void 0 : data.doc_number },
                    });
                    if (isDocNumberExist) {
                        const log = logsHandler("error", `محاولة إدخال معاملة مسبقة رقم ${isDocNumberExist.doc_number} من المستخدم ${userWhoUpdate.username}`, prisma);
                        pubsub.publish(LOGGER, log);
                        throw new Error("يوجد معاملة بهذا الرقم مسبقاً: تأكد من إدخالك");
                    }
                }
                const updateDocumentNow = await prisma.document.update({
                    where: {
                        id: doc_id,
                    },
                    data: {
                        ...data,
                    },
                });
                if (updateDocumentNow) {
                    const log = logsHandler("info", `تم تحديث الملف رقم ${updateDocumentNow.doc_number} بنجاح من المستخدم ${userWhoUpdate.username}`, prisma);
                    pubsub.publish(LOGGER, log);
                    return "success";
                }
                const log = logsHandler("warning", `مشكلة في تحديث الملف من قبل المستخدم ${userWhoUpdate.username}`, prisma);
                pubsub.publish(LOGGER, log);
                return "somthing went wrong!";
            },
        });
    },
});
exports.DeleteDocument = schema_1.extendType({
    type: "Mutation",
    definition(t) {
        t.field("deleteDocment", {
            type: "Document",
            nullable: false,
            args: {
                id: schema_1.intArg({ required: true }),
            },
            resolve: async (_root, args, { prisma, req, pubsub, userId }) => {
                var _a, _b;
                const uid = await userId(req);
                const holdeDocumentInfo = [];
                const user = await prisma.user.findOne({ where: { id: uid } });
                const document = await prisma.document.findOne({
                    where: { id: args.id },
                    include: { user: true, attachment: true },
                });
                if (!document || (user === null || user === void 0 ? void 0 : user.rule) === "VIEWER") {
                    throw new Error("not yours to delete");
                }
                holdeDocumentInfo.push(document);
                document.attachment.forEach(async (v) => {
                    var _a, _b;
                    const folderName = (_a = v.file_url) === null || _a === void 0 ? void 0 : _a.split("://")[1].split("/")[3];
                    const fileName = (_b = v.file_url) === null || _b === void 0 ? void 0 : _b.split("://")[1].split("/")[4];
                    const fileToDelete = `${enums_2.UPLOADS_FOLDER}/${folderName}/${fileName}`;
                    await deleteFileSync(fileToDelete);
                });
                const folderName = (_a = document.file_url) === null || _a === void 0 ? void 0 : _a.split("://")[1].split("/")[3];
                const fileName = (_b = document.file_url) === null || _b === void 0 ? void 0 : _b.split("://")[1].split("/")[4];
                const fileToDelete = `${enums_2.UPLOADS_FOLDER}/${folderName}/${fileName}`;
                await deleteFileSync(fileToDelete);
                await prisma.attachment.deleteMany({ where: { docId: document.id } });
                await prisma.document.delete({
                    where: { id: args.id },
                });
                await pubsub.publish(enums_1.DocumentPost.DOC_CHANNEL, {
                    mutation: enums_1.DocumentPost.DELETED,
                    doc: holdeDocumentInfo[0],
                });
                const log = logsHandler("warning", `تم حذف المعاملة رقم ${holdeDocumentInfo[0].doc_number || "0000"} من قبل المستخدم ${user === null || user === void 0 ? void 0 : user.username}`, prisma);
                pubsub.publish(LOGGER, log);
                console.log(holdeDocumentInfo[0]);
                return holdeDocumentInfo[0];
            },
        });
    },
});
exports.DocumentQuery = schema_1.extendType({
    type: "Query",
    definition(t) {
        t.crud.documents();
    },
});
exports.DocumentSearchQuery = schema_1.extendType({
    type: "Query",
    definition(t) {
        t.list.field("search", {
            type: "Document",
            nullable: true,
            args: {
                query: schema_1.stringArg(),
            },
            resolve: async (_root, args, { prisma }) => {
                const { query } = args;
                const results = await prisma.document.findMany({
                    where: {
                        OR: [
                            {
                                content: {
                                    startsWith: String(query),
                                },
                            },
                            {
                                content: {
                                    contains: String(query),
                                },
                            },
                            {
                                doc_date: {
                                    equals: String(query),
                                },
                            },
                            {
                                doc_number: {
                                    equals: String(query),
                                },
                            },
                        ],
                    },
                });
                return results;
            },
        });
    },
});
exports.DocumentSubscrbtionType = schema_1.objectType({
    name: "DocumentSub",
    definition(t) {
        t.string("mutation");
        t.field("doc", { type: "Document" });
    },
});
exports.DocumentSubscrbtion = schema_1.subscriptionField("document", {
    type: "DocumentSub",
    subscribe: (_root, args, { pubsub }) => {
        return pubsub.asyncIterator(enums_1.DocumentPost.DOC_CHANNEL);
    },
    resolve: (payload) => payload,
});
exports.DocumentCountSub = schema_1.subscriptionField("count", {
    type: "Int",
    subscribe: async (_root, _args, { pubsub }) => {
        return pubsub.asyncIterator("count");
    },
    resolve: (payload) => payload,
});
//# sourceMappingURL=Document.js.map