import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const tmpDbPath = '/tmp/dev.db';

let dbUrl = process.env.DATABASE_URL;

if (isServerless) {
  try {
    const candidatePaths = [
      path.join(process.cwd(), 'prisma', 'dev.db'),
      path.join(process.cwd(), 'dev.db'),
      path.join(__dirname, 'prisma', 'dev.db'),
      path.join(__dirname, 'dev.db'),
      path.join(__dirname, '..', 'prisma', 'dev.db'),
      path.join(__dirname, '..', '..', 'prisma', 'dev.db'),
    ];

    let copied = false;
    const needsCopy = !fs.existsSync(tmpDbPath) || fs.statSync(tmpDbPath).size === 0;

    if (needsCopy) {
      for (const candidate of candidatePaths) {
        if (fs.existsSync(candidate) && fs.statSync(candidate).size > 0) {
          fs.copyFileSync(candidate, tmpDbPath);
          console.log(`[Prisma Serverless] Copied prebuilt DB from ${candidate} to ${tmpDbPath}`);
          copied = true;
          break;
        }
      }
      if (!copied && !fs.existsSync(tmpDbPath)) {
        fs.writeFileSync(tmpDbPath, '');
      }
    }
  } catch (e) {
    console.warn('[Prisma Serverless DB Setup Warning]:', e);
  }
  dbUrl = `file:${tmpDbPath}`;
  process.env.DATABASE_URL = dbUrl;
} else if (!dbUrl) {
  dbUrl = 'file:./dev.db';
  process.env.DATABASE_URL = dbUrl;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

let schemaInitialized = false;

export async function ensureDatabaseTables() {
  if (schemaInitialized) return;
  try {
    await prisma.$queryRawUnsafe('SELECT 1 FROM "User" LIMIT 1;');
    schemaInitialized = true;
    return;
  } catch (err: any) {
    console.log('[SQLite Schema] Initializing database tables...');
    const statements = [
      'CREATE TABLE IF NOT EXISTS "User" ("id" TEXT PRIMARY KEY, "name" TEXT NOT NULL, "email" TEXT NOT NULL UNIQUE, "passwordHash" TEXT NOT NULL, "role" TEXT NOT NULL DEFAULT \'SALES_STAFF\', "status" TEXT NOT NULL DEFAULT \'ACTIVE\', "mustChangePassword" BOOLEAN NOT NULL DEFAULT 0, "lastLoginAt" DATETIME, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP);',
      'CREATE TABLE IF NOT EXISTS "Session" ("id" TEXT PRIMARY KEY, "userId" TEXT NOT NULL, "token" TEXT NOT NULL UNIQUE, "expiresAt" DATETIME NOT NULL, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP);',
      'CREATE TABLE IF NOT EXISTS "Lead" ("id" TEXT PRIMARY KEY, "name" TEXT NOT NULL, "mobile" TEXT NOT NULL, "normalizedMobile" TEXT NOT NULL UNIQUE, "email" TEXT, "company" TEXT, "city" TEXT, "source" TEXT DEFAULT \'Direct\', "initialRequirements" TEXT, "notes" TEXT, "status" TEXT NOT NULL DEFAULT \'NEW\', "assignedToId" TEXT, "createdById" TEXT, "updatedById" TEXT, "notInterestedReason" TEXT, "notInterestedNotes" TEXT, "demoDate" TEXT, "demoTime" TEXT, "demoLink" TEXT, "meetingId" TEXT, "password" TEXT, "demoNotes" TEXT, "demoStatus" TEXT, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "convertedAt" DATETIME);',
      'CREATE TABLE IF NOT EXISTS "Call" ("id" TEXT PRIMARY KEY, "leadId" TEXT NOT NULL, "callDate" TEXT NOT NULL, "callTime" TEXT NOT NULL, "callResult" TEXT NOT NULL, "customerResponse" TEXT NOT NULL, "notes" TEXT, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP);',
      'CREATE TABLE IF NOT EXISTS "FollowUp" ("id" TEXT PRIMARY KEY, "leadId" TEXT NOT NULL, "followUpDate" TEXT NOT NULL, "followUpTime" TEXT NOT NULL, "note" TEXT NOT NULL, "reminderEnabled" BOOLEAN NOT NULL DEFAULT 1, "status" TEXT NOT NULL DEFAULT \'PENDING\', "completedAt" DATETIME, "createdById" TEXT, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP);',
      'CREATE TABLE IF NOT EXISTS "Demo" ("id" TEXT PRIMARY KEY, "leadId" TEXT NOT NULL, "demoDate" TEXT NOT NULL, "demoTime" TEXT NOT NULL, "duration" TEXT DEFAULT \'30 mins\', "status" TEXT NOT NULL DEFAULT \'SCHEDULED\', "demoLink" TEXT, "meetingId" TEXT, "password" TEXT, "requirements" TEXT, "notes" TEXT, "demoResult" TEXT, "assignedTo" TEXT DEFAULT \'Sales Representative\', "reminderEnabled" BOOLEAN NOT NULL DEFAULT 1, "reminderTime" TEXT DEFAULT \'15_MINS\', "completedAt" DATETIME, "createdById" TEXT, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP);',
      'CREATE TABLE IF NOT EXISTS "Activity" ("id" TEXT PRIMARY KEY, "leadId" TEXT, "clientId" TEXT, "projectId" TEXT, "userId" TEXT, "userName" TEXT, "activityType" TEXT NOT NULL, "description" TEXT NOT NULL, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP);',
      'CREATE TABLE IF NOT EXISTS "Client" ("id" TEXT PRIMARY KEY, "leadId" TEXT UNIQUE, "name" TEXT NOT NULL, "mobile" TEXT NOT NULL, "normalizedMobile" TEXT NOT NULL UNIQUE, "email" TEXT, "company" TEXT, "city" TEXT, "address" TEXT, "status" TEXT NOT NULL DEFAULT \'ACTIVE\', "clientSince" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "notes" TEXT, "createdById" TEXT, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP);',
      'CREATE TABLE IF NOT EXISTS "Project" ("id" TEXT PRIMARY KEY, "clientId" TEXT NOT NULL, "name" TEXT NOT NULL, "type" TEXT, "description" TEXT, "requirements" TEXT, "status" TEXT NOT NULL DEFAULT \'IN_PROGRESS\', "startDate" TEXT, "expectedCompletionDate" TEXT, "notes" TEXT, "createdById" TEXT, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP);',
      'CREATE TABLE IF NOT EXISTS "Quotation" ("id" TEXT PRIMARY KEY, "leadId" TEXT NOT NULL, "quotationNumber" TEXT NOT NULL UNIQUE, "parentQuotationId" TEXT, "revisionNumber" INTEGER NOT NULL DEFAULT 0, "projectTitle" TEXT NOT NULL, "projectDescription" TEXT, "currency" TEXT NOT NULL DEFAULT \'INR\', "quotationDate" TEXT NOT NULL, "validUntil" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT \'DRAFT\', "subtotal" REAL NOT NULL DEFAULT 0, "itemDiscountTotal" REAL NOT NULL DEFAULT 0, "overallDiscountType" TEXT DEFAULT \'FIXED\', "overallDiscountValue" REAL NOT NULL DEFAULT 0, "overallDiscountAmount" REAL NOT NULL DEFAULT 0, "taxTotal" REAL NOT NULL DEFAULT 0, "grandTotal" REAL NOT NULL DEFAULT 0, "amountInWords" TEXT, "paymentTerms" TEXT, "notes" TEXT, "rejectionReason" TEXT, "rejectionNotes" TEXT, "companySnapshot" TEXT, "clientSnapshot" TEXT, "termsSnapshot" TEXT, "pdfFileReference" TEXT, "createdById" TEXT, "sentAt" DATETIME, "acceptedAt" DATETIME, "rejectedAt" DATETIME, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP);',
      'CREATE TABLE IF NOT EXISTS "QuotationItem" ("id" TEXT PRIMARY KEY, "quotationId" TEXT NOT NULL, "name" TEXT NOT NULL, "description" TEXT, "quantity" REAL NOT NULL DEFAULT 1, "unitPrice" REAL NOT NULL DEFAULT 0, "discountType" TEXT DEFAULT \'FIXED\', "discountValue" REAL NOT NULL DEFAULT 0, "discountAmount" REAL NOT NULL DEFAULT 0, "taxRate" REAL NOT NULL DEFAULT 18, "taxAmount" REAL NOT NULL DEFAULT 0, "total" REAL NOT NULL DEFAULT 0, "sortOrder" INTEGER NOT NULL DEFAULT 0, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP);',
      'CREATE TABLE IF NOT EXISTS "CompanySetting" ("id" TEXT PRIMARY KEY DEFAULT \'default\', "companyName" TEXT NOT NULL DEFAULT \'NEURONEXUS NEXT-GEN INTELLIGENCE\', "logo" TEXT DEFAULT \'/logo.png\', "email" TEXT DEFAULT \'sales@neuronexus.ai\', "phone" TEXT DEFAULT \'+91 98765 43210\', "website" TEXT DEFAULT \'https://neuronexus.ai\', "address" TEXT DEFAULT \'123 Tech Park, Suite 400, Mumbai, India\', "gstNumber" TEXT DEFAULT \'27AAAAA0000A1Z5\', "state" TEXT DEFAULT \'Maharashtra (27)\', "bankName" TEXT DEFAULT \'HDFC BANK\', "accountNumber" TEXT DEFAULT \'50200012345678\', "ifscCode" TEXT DEFAULT \'HDFC0001234\', "branchName" TEXT DEFAULT \'Mumbai Branch\', "quotationPrefix" TEXT NOT NULL DEFAULT \'QT-\', "defaultCurrency" TEXT NOT NULL DEFAULT \'INR\', "defaultGstRate" REAL NOT NULL DEFAULT 18, "defaultTerms" TEXT, "defaultPaymentTerms" TEXT DEFAULT \'50% Advance Payment, 50% upon final project completion.\', "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP);',
    ];

    for (const stmt of statements) {
      try {
        await prisma.$executeRawUnsafe(stmt);
      } catch (stmtErr) {}
    }
    schemaInitialized = true;
  }
}
