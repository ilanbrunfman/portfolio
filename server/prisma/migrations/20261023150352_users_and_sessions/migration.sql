-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- Data migration: every account needs an owner, but existing accounts have
-- none. Add the column as optional, give existing accounts to a demo user
-- (only created if there are accounts), then make the column required.
-- Demo login: demo@bank.test / demo1234 (only its scrypt hash is stored).
ALTER TABLE "accounts" ADD COLUMN "userId" INTEGER;

INSERT INTO "users" ("email", "passwordHash")
SELECT 'demo@bank.test', 'scrypt$8pyrKEPLPQdOVdJEmkyCKA$QIZ34GAQ_2DBJmZKYJFsa6XiBVIgdLClnAMoBMCHQLH4bmN48NA9BsmDYhjOXEpHGeOzewPlbjgj9n3OK2sVQg'
WHERE EXISTS (SELECT 1 FROM "accounts");

UPDATE "accounts" SET "userId" = (SELECT "id" FROM "users" WHERE "email" = 'demo@bank.test')
WHERE "userId" IS NULL;

ALTER TABLE "accounts" ALTER COLUMN "userId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE INDEX "accounts_userId_idx" ON "accounts"("userId");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
