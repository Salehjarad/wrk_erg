"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddAttachment = exports.Attachment = void 0;
const schema_1 = require("@nexus/schema");
const utils_1 = require("../utils");
exports.Attachment = schema_1.objectType({
    name: "Attachment",
    definition(t) {
        t.model.id();
        t.model.doc({ type: "Document" });
        t.model.docId();
        t.model.file_url();
        t.model.created_at();
        t.model.updated_at();
    },
});
exports.AddAttachment = schema_1.extendType({
    type: "Mutation",
    definition(t) {
        t.field("addAttachment", {
            type: "String",
            args: {
                docId: schema_1.intArg({ required: true }),
                file: schema_1.arg({ type: "Upload", required: true }),
            },
            resolve: async (_root, args, { prisma, req, userId }) => {
                var _a, _b;
                let pathOfAttachment;
                try {
                    const uid = await userId(req);
                    const { docId, file } = args;
                    const user = await prisma.user.findOne({ where: { id: uid } });
                    const doc = await prisma.document.findOne({ where: { id: docId } });
                    const { createReadStream, filename, mimetype, encoding } = await file;
                    if (!user || user.rule === "VIEWER") {
                        throw new Error("غير مصرح لك");
                    }
                    else if (!file) {
                        throw new Error("لا يوجد ملف لرفعه");
                    }
                    else if (!doc) {
                        throw new Error("لا يمكن ارفاق ملف لهذه المعاملة لعدم وجودها مسبقاً");
                    }
                    const oldFileFolder = (_a = doc.file_url) === null || _a === void 0 ? void 0 : _a.split("://")[1].split("/")[3];
                    const oldFileName = `مرفقات-${Date.now()}-${(_b = doc.file_url) === null || _b === void 0 ? void 0 : _b.split("://")[1].split("/")[4]}`;
                    const upload = await utils_1.upload_proccessing({
                        stream: createReadStream(),
                        filename: oldFileName,
                        mimetype,
                        foldername: oldFileFolder,
                    });
                    if (!upload) {
                        throw new Error("no attachment!");
                    }
                    pathOfAttachment = `${req.protocol}://${req.headers.host}/docs/uploads/${upload.filename}`;
                    await prisma.attachment.create({
                        data: {
                            file_url: pathOfAttachment,
                            doc: {
                                connect: {
                                    id: docId,
                                },
                            },
                        },
                    });
                    return "success";
                }
                catch (e) {
                    throw new Error(e);
                }
            },
        });
    },
});
//# sourceMappingURL=Attachment.js.map