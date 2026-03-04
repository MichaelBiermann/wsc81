-- CreateTable
CREATE TABLE "Recap" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "titleDe" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "bodyDe" TEXT NOT NULL,
    "bodyEn" TEXT NOT NULL,
    "eventDate" DATE,
    "imageUrl" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recap_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Recap_slug_key" ON "Recap"("slug");

-- CreateIndex
CREATE INDEX "Recap_status_eventDate_idx" ON "Recap"("status", "eventDate");
