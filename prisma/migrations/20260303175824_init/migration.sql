-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('HERR', 'FRAU', 'DIVERS');

-- CreateEnum
CREATE TYPE "MembershipCategory" AS ENUM ('FAMILIE', 'ERWACHSENE', 'JUGENDLICHE', 'SENIOREN', 'GDB');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "NewsletterStatus" AS ENUM ('DRAFT', 'SENT');

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PendingMembership" (
    "id" TEXT NOT NULL,
    "category" "MembershipCategory" NOT NULL,
    "person1Name" TEXT NOT NULL,
    "person1Dob" DATE NOT NULL,
    "person2Name" TEXT,
    "person2Dob" DATE,
    "person3Name" TEXT,
    "person3Dob" DATE,
    "person4Name" TEXT,
    "person4Dob" DATE,
    "person5Name" TEXT,
    "person5Dob" DATE,
    "street" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "ibanEncrypted" TEXT NOT NULL,
    "ibanLast4" TEXT NOT NULL,
    "bic" TEXT NOT NULL,
    "consentData" BOOLEAN NOT NULL,
    "consentCancellation" BOOLEAN NOT NULL,
    "consentBylaws" BOOLEAN NOT NULL,
    "activationToken" TEXT NOT NULL,
    "tokenExpiresAt" TIMESTAMP(3) NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'de',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PendingMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Member" (
    "id" TEXT NOT NULL,
    "memberNumber" SERIAL NOT NULL,
    "category" "MembershipCategory" NOT NULL,
    "person1Name" TEXT NOT NULL,
    "person1Dob" DATE NOT NULL,
    "person2Name" TEXT,
    "person2Dob" DATE,
    "person3Name" TEXT,
    "person3Dob" DATE,
    "person4Name" TEXT,
    "person4Dob" DATE,
    "person5Name" TEXT,
    "person5Dob" DATE,
    "street" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "ibanEncrypted" TEXT NOT NULL,
    "ibanLast4" TEXT NOT NULL,
    "bic" TEXT NOT NULL,
    "feesPaid" BOOLEAN NOT NULL DEFAULT false,
    "locale" TEXT NOT NULL DEFAULT 'de',
    "activatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "titleDe" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "descriptionDe" TEXT NOT NULL,
    "descriptionEn" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "depositAmount" DECIMAL(8,2) NOT NULL,
    "totalAmount" DECIMAL(8,2) NOT NULL,
    "maxParticipants" INTEGER,
    "registrationDeadline" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventBooking" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "person1Name" TEXT NOT NULL,
    "person1Dob" DATE NOT NULL,
    "person2Name" TEXT,
    "person2Dob" DATE,
    "person3Name" TEXT,
    "person3Dob" DATE,
    "person4Name" TEXT,
    "person4Dob" DATE,
    "person5Name" TEXT,
    "person5Dob" DATE,
    "street" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "isMember" BOOLEAN NOT NULL DEFAULT false,
    "remarks" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'de',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sponsor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "websiteUrl" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sponsor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsPost" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "titleDe" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "bodyDe" TEXT NOT NULL,
    "bodyEn" TEXT NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Page" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "titleDe" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "bodyDe" TEXT NOT NULL,
    "bodyEn" TEXT NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Page_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Newsletter" (
    "id" TEXT NOT NULL,
    "subjectDe" TEXT NOT NULL,
    "subjectEn" TEXT NOT NULL,
    "bodyDe" TEXT NOT NULL,
    "bodyEn" TEXT NOT NULL,
    "status" "NewsletterStatus" NOT NULL DEFAULT 'DRAFT',
    "sentAt" TIMESTAMP(3),
    "recipientCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Newsletter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClubSettings" (
    "id" TEXT NOT NULL,
    "bankName" TEXT NOT NULL DEFAULT '',
    "ibanEncrypted" TEXT NOT NULL DEFAULT '',
    "ibanLast4" TEXT NOT NULL DEFAULT '',
    "bic" TEXT NOT NULL DEFAULT '',
    "feeCollectionDay" INTEGER NOT NULL DEFAULT 1,
    "feeCollectionMonth" INTEGER NOT NULL DEFAULT 10,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClubSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PendingMembership_email_key" ON "PendingMembership"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PendingMembership_activationToken_key" ON "PendingMembership"("activationToken");

-- CreateIndex
CREATE INDEX "PendingMembership_tokenExpiresAt_idx" ON "PendingMembership"("tokenExpiresAt");

-- CreateIndex
CREATE INDEX "PendingMembership_email_idx" ON "PendingMembership"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Member_memberNumber_key" ON "Member"("memberNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Member_email_key" ON "Member"("email");

-- CreateIndex
CREATE INDEX "Member_email_idx" ON "Member"("email");

-- CreateIndex
CREATE INDEX "Event_startDate_idx" ON "Event"("startDate");

-- CreateIndex
CREATE INDEX "EventBooking_eventId_idx" ON "EventBooking"("eventId");

-- CreateIndex
CREATE INDEX "EventBooking_email_idx" ON "EventBooking"("email");

-- CreateIndex
CREATE INDEX "Sponsor_displayOrder_idx" ON "Sponsor"("displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "NewsPost_slug_key" ON "NewsPost"("slug");

-- CreateIndex
CREATE INDEX "NewsPost_status_publishedAt_idx" ON "NewsPost"("status", "publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Page_slug_key" ON "Page"("slug");

-- AddForeignKey
ALTER TABLE "EventBooking" ADD CONSTRAINT "EventBooking_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
