/*
  Warnings:

  - Made the column `transferredFromDriverId` on table `ShiftTransferEvent` required. This step will fail if there are existing NULL values in that column.
  - Made the column `workPeriodId` on table `ShiftTransferEvent` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "ShiftTransferEvent" ALTER COLUMN "transferredFromDriverId" SET NOT NULL,
ALTER COLUMN "workPeriodId" SET NOT NULL;
