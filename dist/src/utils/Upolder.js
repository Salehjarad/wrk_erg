"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload_proccessing = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const helpers_1 = require("../helpers/");
exports.upload_proccessing = async (args) => {
    const { stream, filename, mimetype, foldername } = await args;
    const Extname = path_1.extname(filename);
    const newFilename = `${Date.now()}-arch${Extname}`;
    const filePath = `${helpers_1.UPLOADS_FOLDER}/${foldername}/${filename}`;
    return new Promise((resolve, reject) => {
        stream
            .pipe(fs_1.createWriteStream(filePath))
            .on("finish", () => resolve({
            path: filePath,
            filename: `${foldername}/${filename}`,
            mimetype,
        }))
            .on("error", reject);
    });
};
//# sourceMappingURL=Upolder.js.map