import {
  objectType,
  extendType,
  stringArg,
  arg,
  intArg,
  inputObjectType,
} from "@nexus/schema";
import { upload_proccessing } from "../utils";
import { TagClean } from "../helpers";

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
    t.model.attachment({ type: "Attachment" });
  },
});

export const Hello = extendType({
  type: "Query",
  definition(t) {
    t.field("helloworld", {
      type: "String",
      resolve: () => "hello world",
    });
  },
});

export const TagsInput = inputObjectType({
  name: "TagInput",
  definition(t) {
    t.list.string("value", { required: true });
  },
});

export const CreateDocument = extendType({
  type: "Mutation",
  definition(t) {
    t.field("createDocument", {
      type: "Document",
      nullable: false,
      args: {
        content: stringArg({ required: true }),
        doc_number: stringArg({ required: true }),
        doc_date: stringArg({ required: true }),
        doc_type: stringArg({ required: true }),
        userId: intArg({ required: true }),
        hashtag: arg({
          type: "TagInput",
          required: true,
          default: { value: ["new"] },
        }),
        file: arg({ type: "Upload", required: false }),
      },
      resolve: async (_root, args, { prisma, req }) => {
        let pathone = "";
        const {
          content,
          doc_date,
          doc_number,
          userId,
          hashtag,
          doc_type,
          file,
        } = args;
        if (file) {
          const { createReadStream, filename, mimetype } = await file;
          console.log("file", file.filename);
          const didUploadFile = await upload_proccessing({
            stream: createReadStream(),
            filename,
            mimetype,
          });
          if (didUploadFile) {
            pathone = `${req.protocol}://${req.headers.host}/docs/uploads/${didUploadFile.filename}`;
            console.log(pathone);
          }
        }
        const exist_tags = await prisma.tag.findMany({});
        const tags = await TagClean(hashtag, exist_tags);
        const newPost = await prisma.document.create({
          data: {
            content,
            doc_number,
            doc_date,
            doc_type,
            file_url: pathone,
            user: {
              connect: {
                id: userId,
              },
            },
            tags,
          },
        });

        return newPost;
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
