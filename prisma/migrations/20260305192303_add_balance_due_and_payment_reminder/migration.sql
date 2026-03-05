-- AlterTable
ALTER TABLE "ClubSettings" ADD COLUMN     "paymentReminderWeeks" INTEGER NOT NULL DEFAULT 4;

-- AlterTable
ALTER TABLE "EventBooking" ADD COLUMN     "balanceDue" DECIMAL(8,2),
ADD COLUMN     "paymentReminderSentAt" TIMESTAMP(3);
