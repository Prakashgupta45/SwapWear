-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "Category" AS ENUM ('TOPWEAR', 'BOTTOMWEAR', 'DRESS', 'OUTERWEAR', 'FOOTWEAR', 'ACCESSORIES');

-- CreateEnum
CREATE TYPE "Condition" AS ENUM ('NEW', 'LIKE_NEW', 'GOOD', 'FAIR');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'SWAPPED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "bio" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clothing_listings" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "Category" NOT NULL,
    "brand" TEXT,
    "size" TEXT NOT NULL,
    "condition" "Condition" NOT NULL,
    "estimatedSwapValue" DOUBLE PRECISION,
    "status" "ListingStatus" NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clothing_listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clothing_images" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clothing_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "clothing_listings_ownerId_idx" ON "clothing_listings"("ownerId");

-- CreateIndex
CREATE INDEX "clothing_listings_status_idx" ON "clothing_listings"("status");

-- CreateIndex
CREATE INDEX "clothing_listings_category_idx" ON "clothing_listings"("category");

-- CreateIndex
CREATE INDEX "clothing_images_listingId_idx" ON "clothing_images"("listingId");

-- AddForeignKey
ALTER TABLE "clothing_listings" ADD CONSTRAINT "clothing_listings_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clothing_images" ADD CONSTRAINT "clothing_images_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "clothing_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
