-- CreateTable
CREATE TABLE "entries_projection" (
    "id" UUID NOT NULL,
    "driverId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "effectiveStartTime" TIMESTAMP(3) NOT NULL,
    "effectiveEndTime" TIMESTAMP(3),
    "sourceId" UUID NOT NULL,
    "sourceType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "entries_projection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "entries_projection_driverId_effectiveStartTime_idx" ON "entries_projection"("driverId", "effectiveStartTime");

-- CreateIndex
CREATE INDEX "entries_projection_driverId_effectiveEndTime_idx" ON "entries_projection"("driverId", "effectiveEndTime");

-- CreateIndex
CREATE INDEX "entries_projection_driverId_effectiveStartTime_effectiveEnd_idx" ON "entries_projection"("driverId", "effectiveStartTime", "effectiveEndTime");
