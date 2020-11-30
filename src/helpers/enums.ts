import { resolve } from "path";

export const UPLOADS_FOLDER = resolve("D:\\server_uploades\\");
// export const UPLOADS_FOLDER = resolve("/usr/app/server_uploades/");

export enum DocumentPost {
  DOC_CHANNEL = "doc-channel",
  ADDED = "document_added",
  UPDATED = "document_updated",
  DELETED = "document_deleted",
}
