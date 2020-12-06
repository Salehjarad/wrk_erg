"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentPost = exports.UPLOADS_FOLDER = void 0;
const path_1 = require("path");
let upload_folder;
if (process.env.NODE_ENV === "production") {
    upload_folder = path_1.resolve("/usr/app/server_uploades/");
}
else {
    upload_folder = path_1.resolve("D:\\server_uploades\\");
}
exports.UPLOADS_FOLDER = upload_folder;
var DocumentPost;
(function (DocumentPost) {
    DocumentPost["DOC_CHANNEL"] = "doc-channel";
    DocumentPost["ADDED"] = "document_added";
    DocumentPost["UPDATED"] = "document_updated";
    DocumentPost["DELETED"] = "document_deleted";
})(DocumentPost = exports.DocumentPost || (exports.DocumentPost = {}));
//# sourceMappingURL=enums.js.map