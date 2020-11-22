import { objectType, extendType, stringArg, arg, intArg } from "@nexus/schema";
import { upload_proccessing } from "../utils";

export const Attachment = objectType({
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

export const AddAttachment = extendType({
  type: "Mutation",
  definition(t) {
    t.field("addAttachment", {
      type: "String",
      args: {
        docId: intArg({ required: true }),
        file: arg({ type: "Upload", required: true }),
      },
      resolve: async (_root, args, { prisma, req, userId }) => {
        let pathOfAttachment;
        try {
          const uid: number = await userId(req);
          const { docId, file } = args;
          const user = await prisma.user.findOne({ where: { id: uid } });
          const doc = await prisma.document.findOne({ where: { id: docId } });

          const { createReadStream, filename, mimetype, encoding } = await file;
          if (!user || user.rule === "VIEWER") {
            throw new Error("غير مصرح لك");
          } else if (!file) {
            throw new Error("لا يوجد ملف لرفعه");
          } else if (!doc) {
            throw new Error(
              "لا يمكن ارفاق ملف لهذه المعاملة لعدم وجودها مسبقاً"
            );
          }
          const oldFileFolder = doc.file_url?.split("://")[1].split("/")[3];
          const oldFileName = `مرفقات-${Date.now()}-${
            doc.file_url?.split("://")[1].split("/")[4]
          }`;

          const upload = await upload_proccessing({
            stream: createReadStream(),
            filename: oldFileName!,
            mimetype,
            foldername: oldFileFolder!,
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
        } catch (e) {
          throw new Error(e);
        }
      },
    });
  },
});
