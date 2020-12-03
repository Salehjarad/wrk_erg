import { PrismaClient } from "@prisma/client";
import { Request } from "express";
import { makeToken, userId } from "./usertoken";
import { PubSub } from "apollo-server-express";
import { configure, getLogger, Logger } from "log4js";
import { join } from "path";

configure(join(__dirname, "../log4js.json"));

const prisma = new PrismaClient();
const pubsub = new PubSub();
const logger = getLogger();

export interface Context {
  prisma: PrismaClient;
  req: Request;
  pubsub: PubSub;
  makeToken: typeof makeToken;
  userId: typeof userId;
  logger: Logger;
}

export function createContext({ req }: { req: Request }): Context {
  return {
    prisma,
    req,
    userId,
    makeToken,
    pubsub,
    logger,
  };
}
