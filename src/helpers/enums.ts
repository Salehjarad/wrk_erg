import { resolve } from "path";

let upload_folder;
if (process.env.NODE_ENV === "production") {
  upload_folder = resolve("/usr/app/server_uploades/");
} else {
  upload_folder = resolve("D:\\server_uploades\\");
}

export const UPLOADS_FOLDER = upload_folder;

export enum DocumentPost {
  DOC_CHANNEL = "doc-channel",
  ADDED = "document_added",
  UPDATED = "document_updated",
  DELETED = "document_deleted",
}
