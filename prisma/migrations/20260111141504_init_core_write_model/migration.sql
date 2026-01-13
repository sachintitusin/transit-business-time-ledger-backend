-- CreateEnum
CREATE TYPE "WorkPeriodStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateTable
CREATE TABLE "Driver" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Driver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkPeriod" (
    "id" UUID NOT NULL,
    "driverId" UUID NOT NULL,
    "declaredStartTime" TIMESTAMP(3) NOT NULL,
    "declaredEndTime" TIMESTAMP(3),
    "status" "WorkPeriodStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkCorrection" (
    "id" UUID NOT NULL,
    "workPeriodId" UUID NOT NULL,
    "correctedStartTime" TIMESTAMP(3) NOT NULL,
    "correctedEndTime" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkCorrection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveEvent" (
    "id" UUID NOT NULL,
    "driverId" UUID NOT NULL,
    "declaredStartTime" TIMESTAMP(3) NOT NULL,
    "declaredEndTime" TIMESTAMP(3) NOT NULL,
    "leaveType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaveEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveCorrection" (
    "id" UUID NOT NULL,
    "leaveId" UUID NOT NULL,
    "correctedStartTime" TIMESTAMP(3) NOT NULL,
    "correctedEndTime" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaveCorrection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Driver_email_key" ON "Driver"("email");

-- CreateIndex
CREATE INDEX "WorkPeriod_driverId_status_idx" ON "WorkPeriod"("driverId", "status");

-- CreateIndex
CREATE INDEX "WorkPeriod_driverId_declaredStartTime_idx" ON "WorkPeriod"("driverId", "declaredStartTime");

-- CreateIndex
CREATE INDEX "WorkCorrection_workPeriodId_createdAt_idx" ON "WorkCorrection"("workPeriodId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "LeaveEvent_driverId_declaredStartTime_idx" ON "LeaveEvent"("driverId", "declaredStartTime");

-- CreateIndex
CREATE INDEX "LeaveCorrection_leaveId_createdAt_idx" ON "LeaveCorrection"("leaveId", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "WorkPeriod" ADD CONSTRAINT "WorkPeriod_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkCorrection" ADD CONSTRAINT "WorkCorrection_workPeriodId_fkey" FOREIGN KEY ("workPeriodId") REFERENCES "WorkPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveEvent" ADD CONSTRAINT "LeaveEvent_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveCorrection" ADD CONSTRAINT "LeaveCorrection_leaveId_fkey" FOREIGN KEY ("leaveId") REFERENCES "LeaveEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
