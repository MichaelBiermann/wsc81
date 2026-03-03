-- AlterTable
ALTER TABLE "User" ADD COLUMN "pendingEmail" TEXT,
                   ADD COLUMN "pendingEmailToken" TEXT,
                   ADD COLUMN "pendingEmailExpiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "User_pendingEmailToken_key" ON "User"("pendingEmailToken");
