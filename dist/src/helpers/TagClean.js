"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TagClean = void 0;
exports.TagClean = (arr1, arr2) => {
    return new Promise((resolve, reject) => {
        if (!arr1 || !arr2) {
            reject("most provide an array yo clean up");
        }
        // clean duplicates and convert to object { value: string } for tag.
        const clearDuplicates = arr1 === null || arr1 === void 0 ? void 0 : arr1.value.filter((v, i, s) => s.findIndex((t) => t === v) === i);
        const convertTagsToObject = clearDuplicates.map((v) => {
            return { value: String(v) };
        });
        // connect to tags if exist
        const connectHandler = convertTagsToObject.filter((v) => {
            return arr2.some((s) => {
                return v.value === s.value;
            });
        });
        // create new tags if not exists
        const createHandler = convertTagsToObject.filter((v) => {
            return !arr2.some((s) => {
                return v.value === s.value;
            });
        });
        resolve({
            connect: [...connectHandler],
            create: [...createHandler],
        });
    });
};
//# sourceMappingURL=TagClean.js.map