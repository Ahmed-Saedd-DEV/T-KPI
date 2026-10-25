-- AlterTable
ALTER TABLE "BranchDailyMetric" ADD COLUMN     "adjustTime" DECIMAL(10,3),
ADD COLUMN     "atVendorTime" DECIMAL(10,3),
ADD COLUMN     "orderCount" INTEGER,
ADD COLUMN     "recordedAt" TIMESTAMP(3),
ALTER COLUMN "opsCR" DROP NOT NULL,
ALTER COLUMN "dispatchTime" DROP NOT NULL,
ALTER COLUMN "prepTime" DROP NOT NULL,
ALTER COLUMN "assignmentTime" DROP NOT NULL;
