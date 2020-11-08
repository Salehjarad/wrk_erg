import { PrismaClient } from "@prisma/client";
import { Request } from "express";
import { makeToken, userId } from "./usertoken";
import { PubSub } from "apollo-server-express";

const prisma = new PrismaClient();
const pubsub = new PubSub();

export interface Context {
  prisma: PrismaClient;
  req: Request;
  pubsub: PubSub;
  makeToken: typeof makeToken;
  userId: typeof userId;
}

export function createContext({ req }: { req: Request }): Context {
  return {
    prisma,
    req,
    userId,
    makeToken,
    pubsub,
  };
}
