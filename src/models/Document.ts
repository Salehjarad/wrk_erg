import {
  objectType,
  extendType,
  stringArg,
  arg,
  intArg,
  inputObjectType,
  subscriptionField,
} from "@nexus/schema";
import { upload_proccessing } from "../utils";
import { TagClean } from "../helpers";
import { DocumentPost } from "../helpers/enums";
import { unlinkSync, existsSync } from "fs";

import { extname } from "path";
import { UPLOADS_FOLDER } from "../helpers/enums";

const deleteFileSync = async (path: any) => {
  if (await existsSync(path)) {
    await unlinkSync(path);
  }
};

const LOGGER = "LOGGER";

const logsHandler = async (type: any, message: any, prisma: any) => {
  return await prisma.logs.create({
    data: {
      type: type,
      message: message,
    },
  });
};

export const Document = objectType({
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

export const DocSize = extendType({
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

export const TagsInput = inputObjectType({
  name: "TagInput",
  definition(t) {
    t.list.string("value", { required: true });
  },
});

export const ResponseError = objectType({
  name: "ResponseError",
  definition(t) {
    t.string("field");
    t.string("message");
  },
});

export const CreateDocumentResponse = objectType({
  name: "CreateDocumentResponse",
  definition(t) {
    t.field("document", { type: "Document", nullable: true }),
      t.list.field("errors", { type: "ResponseError", nullable: true });
  },
});

export const CreateDocument = extendType({
  type: "Mutation",
  definition(t) {
    t.field("createDocument", {
      type: "CreateDocumentResponse",
      nullable: false,
      args: {
        content: stringArg({ required: true }),
        doc_number: stringArg({ required: true }),
        doc_date: stringArg({ required: true }),
        doc_type: stringArg({ required: true }),
        doc_folder: stringArg({ required: true, default: "عام" }),
        hashtag: arg({
          type: "TagInput",
          required: true,
          default: { value: ["new"] },
        }),
        file: arg({ type: "Upload", required: false }),
      },
      resolve: async (_root, args, { prisma, req, pubsub, userId, logger }) => {
        let errors: { field: string; message: string }[] | null = [];
        let pathone = "";
        const uid: any = await userId(req);
        const {
          content,
          doc_date,
          doc_number,
          hashtag,
          doc_type,
          file,
          doc_folder,
        } = args;
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

            const log = logsHandler(
              "error",
              `محاولة إدخال ملف موجود مسبقاً من المستخدم ${user.username}`,
              prisma
            );
            pubsub.publish(LOGGER, log);

            return { document: null, errors: errors };
          }

          if (!file) {
            errors = [
              ...errors,
              { field: "doc_info", message: "يجب إرفاق ملف" },
            ];
            const log = logsHandler(
              "error",
              `محاولة إدخال ملف دون إرفاقه من المستخدم ${user.username}`,
              prisma
            );
            pubsub.publish(LOGGER, log);
            return { document: null, errors: errors };
          }

          const { createReadStream, filename, mimetype } = await file;
          // console.log("file", file.filename);
          logger.info("name", filename);
          const file_extention = extname(filename);
          const tempNameForNow = `${Date.now()}${file_extention}`;
          const newFileBasedOnInfo = `${content
            .trim()
            .split(" ")
            .join("_")}-${doc_date
            .trim()
            .split("/")
            .join(".")
            .split("\\")
            .join(".")}-${doc_number
            .trim()
            .replace(
              "/",
              "."
            )}-${doc_type.trim()}-${Date.now()}${file_extention}`;

          const didUploadFile = await upload_proccessing({
            stream: createReadStream(),
            filename: tempNameForNow,
            mimetype,
            foldername: doc_folder,
          });

          if (didUploadFile) {
            pathone = `${req.protocol}://${req.headers.host}/docs/uploads/${didUploadFile.filename}`;
          }
          const exist_tags = await prisma.tag.findMany({});
          const tags = await TagClean(hashtag, exist_tags);

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
          await pubsub.publish(DocumentPost.DOC_CHANNEL, {
            mutation: DocumentPost.ADDED,
            doc: newPost,
          });
          const log = logsHandler(
            "info",
            `تم إدخال الملف رقم ${newPost.doc_number} بنجاح من المستخدم ${user.username}`,
            prisma
          );
          pubsub.publish(LOGGER, log);
          logger.warn("document id", newPost.doc_number);

          return { document: newPost, errors: null };
        } catch (error) {
          logger.error(error);
          const log = logsHandler(
            "error",
            `خطاء في إدخال الملف رقم ${doc_number}: ${error.message}`,
            prisma
          );
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

export const DocumetUpdateByAdminInput = inputObjectType({
  name: "DocumentUpdatedByAdminInput",
  definition(t) {
    t.string("content", { required: false });
    t.string("doc_number", { required: false });
    t.string("doc_date", { required: false });
  },
});

export const UpdateDocumentByAdminAndUser = extendType({
  type: "Mutation",
  definition(t) {
    t.field("updateDocument", {
      type: "String",
      nullable: true,
      args: {
        doc_id: intArg({ required: true }),
        data: arg({ type: "DocumentUpdatedByAdminInput" }),
      },
      resolve: async (_root, args, { prisma, userId, req, pubsub }) => {
        const { doc_id, data } = args;
        const uid = await userId(req);
        const userWhoUpdate = await prisma.user.findOne({ where: { id: uid } });
        if (!userWhoUpdate) {
          throw new Error("لا يوجد مستخدم مفعل لإتمام هذه العملية");
        } else if (userWhoUpdate.rule === "VIEWER") {
          throw new Error("لا تملك هذه الصلاحيه الرجاء الاتصال بالمسؤول");
        }
        if (data?.doc_number) {
          const isDocNumberExist = await prisma.document.findOne({
            where: { doc_number: data?.doc_number! },
          });
          if (isDocNumberExist) {
            const log = logsHandler(
              "error",
              `محاولة إدخال معاملة مسبقة رقم ${isDocNumberExist.doc_number} من المستخدم ${userWhoUpdate.username}`,
              prisma
            );
            pubsub.publish(LOGGER, log);
            throw new Error("يوجد معاملة بهذا الرقم مسبقاً: تأكد من إدخالك");
          }
        }
        const updateDocumentNow = await prisma.document.update({
          where: {
            id: doc_id!,
          },
          data: {
            ...(data as any),
          },
        });

        if (updateDocumentNow) {
          const log = logsHandler(
            "info",
            `تم تحديث الملف رقم ${updateDocumentNow.doc_number} بنجاح من المستخدم ${userWhoUpdate.username}`,
            prisma
          );
          pubsub.publish(LOGGER, log);
          return "success";
        }

        const log = logsHandler(
          "warning",
          `مشكلة في تحديث الملف من قبل المستخدم ${userWhoUpdate.username}`,
          prisma
        );
        pubsub.publish(LOGGER, log);

        return "somthing went wrong!";
      },
    });
  },
});

export const DeleteDocument = extendType({
  type: "Mutation",
  definition(t) {
    t.field("deleteDocment", {
      type: "Document",
      nullable: false,
      args: {
        id: intArg({ required: true }),
      },
      resolve: async (_root, args, { prisma, req, pubsub, userId }) => {
        const uid: any = await userId(req);
        const holdeDocumentInfo: Partial<any[]> = [];
        const user = await prisma.user.findOne({ where: { id: uid } });
        const document = await prisma.document.findOne({
          where: { id: args.id },
          include: { user: true, attachment: true },
        });
        if (!document || user?.rule === "VIEWER") {
          throw new Error("not yours to delete");
        }

        holdeDocumentInfo.push(document);

        document.attachment.forEach(async (v) => {
          const folderName = v.file_url?.split("://")[1].split("/")[3];
          const fileName = v.file_url?.split("://")[1].split("/")[4];
          const fileToDelete = `${UPLOADS_FOLDER}/${folderName}/${fileName}`;
          await deleteFileSync(fileToDelete);
        });

        const folderName = document.file_url?.split("://")[1].split("/")[3];
        const fileName = document.file_url?.split("://")[1].split("/")[4];
        const fileToDelete = `${UPLOADS_FOLDER}/${folderName}/${fileName}`;
        await deleteFileSync(fileToDelete);

        await prisma.attachment.deleteMany({ where: { docId: document.id } });
        await prisma.document.delete({
          where: { id: args.id },
        });

        await pubsub.publish(DocumentPost.DOC_CHANNEL, {
          mutation: DocumentPost.DELETED,
          doc: holdeDocumentInfo[0],
        });
        const log = logsHandler(
          "warning",
          `تم حذف المعاملة رقم ${
            holdeDocumentInfo[0].doc_number || "0000"
          } من قبل المستخدم ${user?.username}`,
          prisma
        );
        pubsub.publish(LOGGER, log);
        console.log(holdeDocumentInfo[0]);
        return holdeDocumentInfo[0];
      },
    });
  },
});

export const DocumentQuery = extendType({
  type: "Query",
  definition(t) {
    t.crud.documents();
  },
});

export const DocumentSearchQuery = extendType({
  type: "Query",
  definition(t) {
    t.list.field("search", {
      type: "Document",
      nullable: true,
      args: {
        query: stringArg(),
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

export const DocumentSubscrbtionType = objectType({
  name: "DocumentSub",
  definition(t) {
    t.string("mutation");
    t.field("doc", { type: "Document" });
  },
});

export const DocumentSubscrbtion = subscriptionField("document", {
  type: "DocumentSub",
  subscribe: (_root, args, { pubsub }) => {
    return pubsub.asyncIterator(DocumentPost.DOC_CHANNEL);
  },
  resolve: (payload: any) => payload,
});

export const DocumentCountSub = subscriptionField("count", {
  type: "Int",
  subscribe: async (_root, _args, { pubsub }) => {
    return pubsub.asyncIterator("count");
  },
  resolve: (payload) => payload,
});
