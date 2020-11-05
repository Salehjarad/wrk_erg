import { PrismaClient } from '@prisma/client';
import { Request } from 'express';

const prisma = new PrismaClient()

export interface Context {
    prisma: PrismaClient,
    req: Request
}

export function createContext({ req }: { req: Request }): Context {
    return {
        prisma,
        req
    }
}