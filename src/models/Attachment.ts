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
      type: "Attachment",
      args: {
        docId: intArg({ required: true }),
        file: arg({ type: "Upload" }),
      },
      resolve: async (_root, args, { prisma, req }) => {
        let pathOfAttachment;
        try {
          const { docId, file } = args;
          const { createReadStream, filename, mimetype, encoding } = await file;
          const upload = await upload_proccessing({
            stream: createReadStream(),
            filename,
            mimetype,
          });
          if (!upload) {
            throw new Error("no attachment!");
          }
          pathOfAttachment = `${req.protocol}://${req.headers.host}/docs/uploads/${upload.filename}`;
          const addFileToDocs = await prisma.attachment.create({
            data: {
              file_url: pathOfAttachment,
              doc: {
                connect: {
                  id: docId,
                },
              },
            },
          });

          return addFileToDocs;
        } catch (e) {
          throw new Error(e);
        }
      },
    });
  },
});
