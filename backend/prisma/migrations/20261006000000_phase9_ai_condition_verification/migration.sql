-- AlterTable
ALTER TABLE "clothing_listings" ADD COLUMN "aiCondition" "Condition",
ADD COLUMN "aiConfidence" DOUBLE PRECISION,
ADD COLUMN "aiVerificationStatus" TEXT DEFAULT 'NOT_ANALYZED',
ADD COLUMN "aiVisibleIssues" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "aiImageQuality" TEXT,
ADD COLUMN "aiRecommendation" TEXT,
ADD COLUMN "aiAnalyzedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "clothing_listings_aiVerificationStatus_idx" ON "clothing_listings"("aiVerificationStatus");
