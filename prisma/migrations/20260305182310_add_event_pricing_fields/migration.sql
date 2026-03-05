-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "busSurcharge" DECIMAL(8,2) NOT NULL DEFAULT 0,
ADD COLUMN     "roomDoubleSurcharge" DECIMAL(8,2) NOT NULL DEFAULT 0,
ADD COLUMN     "roomSingleSurcharge" DECIMAL(8,2) NOT NULL DEFAULT 0,
ADD COLUMN     "surchargeNonMemberAdult" DECIMAL(8,2) NOT NULL DEFAULT 0,
ADD COLUMN     "surchargeNonMemberChild" DECIMAL(8,2) NOT NULL DEFAULT 0;
