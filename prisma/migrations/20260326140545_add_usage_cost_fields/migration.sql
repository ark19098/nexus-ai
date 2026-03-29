/*
  Warnings:

  - Added the required column `cost` to the `AiUsage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalTokens` to the `AiUsage` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AiUsage" ADD COLUMN     "cost" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "totalTokens" INTEGER NOT NULL;
