import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import path from 'path'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

const getDbUrl = () => {
  if (process.env.DATABASE_URL?.startsWith('file:')) {
    return process.env.DATABASE_URL
  }
  const dbPath = path.resolve(process.cwd(), 'prisma', 'wealth.db')
  return `file:${dbPath}`
}

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter: new PrismaBetterSqlite3({
      url: getDbUrl(),
    }),
    log: process.env.NODE_ENV === 'development' ? ['query'] : [],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
