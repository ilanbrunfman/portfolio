import { PrismaClient } from './generated/prisma/client.ts'
import { PrismaPg } from '@prisma/adapter-pg'

// One shared Prisma client for the whole server.
// Prisma 7 talks to Postgres through a "driver adapter" (here: node-postgres).
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })

export const prisma = new PrismaClient({ adapter })
