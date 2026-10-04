-- CreateEnum
CREATE TYPE "SwapRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'COMPLETED');

-- CreateTable
CREATE TABLE "swap_requests" (
    "id" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "offeredListingId" TEXT NOT NULL,
    "requestedListingId" TEXT NOT NULL,
    "message" TEXT,
    "status" "SwapRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "swap_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "swap_requests_requesterId_idx" ON "swap_requests"("requesterId");

-- CreateIndex
CREATE INDEX "swap_requests_recipientId_idx" ON "swap_requests"("recipientId");

-- CreateIndex
CREATE INDEX "swap_requests_offeredListingId_idx" ON "swap_requests"("offeredListingId");

-- CreateIndex
CREATE INDEX "swap_requests_requestedListingId_idx" ON "swap_requests"("requestedListingId");

-- CreateIndex
CREATE INDEX "swap_requests_status_idx" ON "swap_requests"("status");

-- AddForeignKey
ALTER TABLE "swap_requests" ADD CONSTRAINT "swap_requests_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swap_requests" ADD CONSTRAINT "swap_requests_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swap_requests" ADD CONSTRAINT "swap_requests_offeredListingId_fkey" FOREIGN KEY ("offeredListingId") REFERENCES "clothing_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swap_requests" ADD CONSTRAINT "swap_requests_requestedListingId_fkey" FOREIGN KEY ("requestedListingId") REFERENCES "clothing_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
