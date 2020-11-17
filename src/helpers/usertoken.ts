import jwt, { TokenExpiredError, VerifyOptions } from "jsonwebtoken";
import { Request } from "express";

export const makeToken = (userId: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!userId) {
      reject("no id was provide!");
    }
    const token = jwt.sign(
      {
        userId,
      },
      "saleh"
    );

    resolve(token);
  });
};

export const userId = (req: Request) => {
  return new Promise((resolve, reject) => {
    const authorization = req.headers.authorization;
    if (!authorization) {
      reject("no token found");
    }
    const token = authorization?.split("Bearer ")[1];
    const userToken: any = jwt.verify(token!, "saleh");
    resolve(userToken?.userId);
  });
};
