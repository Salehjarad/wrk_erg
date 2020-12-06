"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userId = exports.makeToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
exports.makeToken = (userId) => {
    return new Promise((resolve, reject) => {
        if (!userId) {
            reject("no id was provide!");
        }
        const token = jsonwebtoken_1.default.sign({
            userId,
        }, "saleh");
        resolve(token);
    });
};
exports.userId = (req) => {
    return new Promise((resolve, reject) => {
        const authorization = req.headers.authorization;
        if (!authorization) {
            reject("no token found");
        }
        const token = authorization === null || authorization === void 0 ? void 0 : authorization.split("Bearer ")[1];
        const userToken = jsonwebtoken_1.default.verify(token, "saleh");
        resolve(userToken === null || userToken === void 0 ? void 0 : userToken.userId);
    });
};
//# sourceMappingURL=usertoken.js.map