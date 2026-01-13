-- CreateTable
CREATE TABLE "ShiftTransferEvent" (
    "id" UUID NOT NULL,
    "driverId" UUID NOT NULL,
    "transferredFromDriverId" UUID,
    "workPeriodId" UUID,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShiftTransferEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ShiftTransferEvent_driverId_createdAt_idx" ON "ShiftTransferEvent"("driverId", "createdAt");

-- CreateIndex
CREATE INDEX "ShiftTransferEvent_workPeriodId_idx" ON "ShiftTransferEvent"("workPeriodId");

-- AddForeignKey
ALTER TABLE "ShiftTransferEvent" ADD CONSTRAINT "ShiftTransferEvent_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftTransferEvent" ADD CONSTRAINT "ShiftTransferEvent_transferredFromDriverId_fkey" FOREIGN KEY ("transferredFromDriverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftTransferEvent" ADD CONSTRAINT "ShiftTransferEvent_workPeriodId_fkey" FOREIGN KEY ("workPeriodId") REFERENCES "WorkPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
