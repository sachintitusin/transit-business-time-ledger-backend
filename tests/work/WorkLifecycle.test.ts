import { describe, it, expect } from "vitest";

import { StartWorkService } from "../../src/application/services/work/StartWorkService";
import { CloseWorkService } from "../../src/application/services/work/CloseWorkService";
import { CorrectWorkService } from "../../src/application/services/work/CorrectWorkService";

import { InMemoryWorkPeriodRepository } from "../fakes/InMemoryWorkPeriodRepository";
import { InMemoryLeaveRepository } from "../fakes/InMemoryLeaveRepository";
import { InMemoryLeaveCorrectionRepository } from "../fakes/InMemoryLeaveCorrectionRepository";
import { InMemoryWorkCorrectionRepository } from "../fakes/InMemoryWorkCorrectionRepository";

import { FakeTransactionManager } from "../fakes/FakeTransactionManager";
import { FakeLogger } from "../fakes/FakeLogger";
import { MaxShiftDurationPolicy } from "../../src/application/policies/MaxShiftDurationPolicy";

import { DriverId } from "../../src/domain/shared/types";

describe("Work lifecycle", () => {

  it("starts work successfully when no work is active", async () => {
    const workRepo = new InMemoryWorkPeriodRepository();
    const tx = new FakeTransactionManager();
    const logger = new FakeLogger();

    const startWork = new StartWorkService(workRepo, tx, logger);

    const driverId = "driver-1" as DriverId;
    const now = new Date("2025-01-01T09:00:00Z");

    await startWork.execute(driverId, now, now);

    const openWork = await workRepo.findOpenByDriver(driverId);

    expect(openWork).not.toBeNull();
    expect(openWork!.isOpen()).toBe(true);
  });

  it("rejects starting work when another work period is already open", async () => {
    const workRepo = new InMemoryWorkPeriodRepository();
    const tx = new FakeTransactionManager();
    const logger = new FakeLogger();

    const startWork = new StartWorkService(workRepo, tx, logger);

    const driverId = "driver-1" as DriverId;
    const now = new Date("2025-01-01T09:00:00Z");

    await startWork.execute(driverId, now, now);

    await expect(
      startWork.execute(driverId, now, now)
    ).rejects.toThrow();
  });

  it("rejects closing work when no work period is open", async () => {
    const workRepo = new InMemoryWorkPeriodRepository();
    const leaveRepo = new InMemoryLeaveRepository();
    const leaveCorrectionRepo = new InMemoryLeaveCorrectionRepository();
    const tx = new FakeTransactionManager();
    const logger = new FakeLogger();
    const policy = new MaxShiftDurationPolicy();

    const closeWork = new CloseWorkService(
      workRepo,
      leaveRepo,
      leaveCorrectionRepo,
      tx,
      policy,
      logger
    );

    const driverId = "driver-1" as DriverId;
    const endTime = new Date("2025-01-01T17:00:00Z");

    await expect(
      closeWork.execute(driverId, endTime)
    ).rejects.toThrow();
  });

  it("closes work successfully", async () => {
    const workRepo = new InMemoryWorkPeriodRepository();
    const leaveRepo = new InMemoryLeaveRepository();
    const leaveCorrectionRepo = new InMemoryLeaveCorrectionRepository();
    const tx = new FakeTransactionManager();
    const logger = new FakeLogger();
    const policy = new MaxShiftDurationPolicy();

    const startWork = new StartWorkService(workRepo, tx, logger);
    const closeWork = new CloseWorkService(
      workRepo,
      leaveRepo,
      leaveCorrectionRepo,
      tx,
      policy,
      logger
    );

    const driverId = "driver-1" as DriverId;

    const start = new Date("2025-01-01T09:00:00Z");
    const end = new Date("2025-01-01T17:00:00Z");

    const workId = await startWork.execute(driverId, start, start);
    await closeWork.execute(driverId, end);

    const work = await workRepo.findById(workId);

    expect(work!.isClosed()).toBe(true);
  });

  it("preserves original work period after correction", async () => {
    const workRepo = new InMemoryWorkPeriodRepository();
    const correctionRepo = new InMemoryWorkCorrectionRepository();
    const leaveRepo = new InMemoryLeaveRepository();
    const leaveCorrectionRepo = new InMemoryLeaveCorrectionRepository();
    const tx = new FakeTransactionManager();
    const logger = new FakeLogger();
    const policy = new MaxShiftDurationPolicy();

    const startWork = new StartWorkService(workRepo, tx, logger);
    const closeWork = new CloseWorkService(
      workRepo,
      leaveRepo,
      leaveCorrectionRepo,
      tx,
      policy,
      logger
    );
    const correctWork = new CorrectWorkService(
      workRepo,
      correctionRepo,
      leaveRepo,
      leaveCorrectionRepo,
      tx,
      policy,
      logger
    );

    const driverId = "driver-1" as DriverId;

    const originalStart = new Date("2025-01-01T09:00:00Z");
    const originalEnd = new Date("2025-01-01T12:00:00Z");

    const workId = await startWork.execute(driverId, originalStart, originalStart);
    await closeWork.execute(driverId, originalEnd);

    await correctWork.execute({
      driverId,
      workPeriodId: workId,
      correctionId: "corr-1" as any,
      correctedStartTime: new Date("2025-01-01T10:00:00Z"),
      correctedEndTime: new Date("2025-01-01T13:00:00Z"),
      now: new Date(),
    });

    const work = await workRepo.findById(workId);

    expect(work!.declaredStartTime).toEqual(originalStart);
    expect(work!.declaredEndTime).toEqual(originalEnd);
  });

  it("keeps declared work time separate from entry time", async () => {
    const workRepo = new InMemoryWorkPeriodRepository();
    const tx = new FakeTransactionManager();
    const logger = new FakeLogger();

    const startWork = new StartWorkService(workRepo, tx, logger);

    const driverId = "driver-1" as DriverId;

    const workTime = new Date("2025-01-01T09:00:00Z");
    const entryTime = new Date("2025-01-03T20:00:00Z");

    const workId = await startWork.execute(driverId, workTime, entryTime);

    const work = await workRepo.findById(workId);

    expect(work!.declaredStartTime).toEqual(workTime);
    expect(work!.createdAt).toEqual(entryTime);
  });

  it("rejects closing work with end time before start time", async () => {
    const workRepo = new InMemoryWorkPeriodRepository();
    const leaveRepo = new InMemoryLeaveRepository();
    const leaveCorrectionRepo = new InMemoryLeaveCorrectionRepository();
    const tx = new FakeTransactionManager();
    const logger = new FakeLogger();
    const policy = new MaxShiftDurationPolicy();

    const startWork = new StartWorkService(workRepo, tx, logger);
    const closeWork = new CloseWorkService(
      workRepo,
      leaveRepo,
      leaveCorrectionRepo,
      tx,
      policy,
      logger
    );

    const driverId = "driver-1" as DriverId;

    const start = new Date("2025-01-01T09:00:00Z");
    const invalidEnd = new Date("2025-01-01T08:00:00Z");

    await startWork.execute(driverId, start, start);

    await expect(
      closeWork.execute(driverId, invalidEnd)
    ).rejects.toThrow();
  });

  it("rejects correcting an OPEN work period", async () => {
    const workRepo = new InMemoryWorkPeriodRepository();
    const correctionRepo = new InMemoryWorkCorrectionRepository();
    const leaveRepo = new InMemoryLeaveRepository();
    const leaveCorrectionRepo = new InMemoryLeaveCorrectionRepository();
    const tx = new FakeTransactionManager();
    const logger = new FakeLogger();
    const policy = new MaxShiftDurationPolicy();

    const startWork = new StartWorkService(workRepo, tx, logger);
    const correctWork = new CorrectWorkService(
      workRepo,
      correctionRepo,
      leaveRepo,
      leaveCorrectionRepo,
      tx,
      policy,
      logger
    );

    const driverId = "driver-1" as DriverId;

    const workId = await startWork.execute(
      driverId,
      new Date("2025-01-01T09:00:00Z"),
      new Date()
    );

    await expect(
      correctWork.execute({
        driverId,
        workPeriodId: workId,
        correctionId: "corr-1" as any,
        correctedStartTime: new Date("2025-01-01T10:00:00Z"),
        correctedEndTime: new Date("2025-01-01T13:00:00Z"),
        now: new Date(),
      })
    ).rejects.toThrow();
  });

  it("allows multiple corrections on same work period", async () => {
    const workRepo = new InMemoryWorkPeriodRepository();
    const correctionRepo = new InMemoryWorkCorrectionRepository();
    const leaveRepo = new InMemoryLeaveRepository();
    const leaveCorrectionRepo = new InMemoryLeaveCorrectionRepository();
    const tx = new FakeTransactionManager();
    const logger = new FakeLogger();
    const policy = new MaxShiftDurationPolicy();

    const startWork = new StartWorkService(workRepo, tx, logger);
    const closeWork = new CloseWorkService(
      workRepo,
      leaveRepo,
      leaveCorrectionRepo,
      tx,
      policy,
      logger
    );
    const correctWork = new CorrectWorkService(
      workRepo,
      correctionRepo,
      leaveRepo,
      leaveCorrectionRepo,
      tx,
      policy,
      logger
    );

    const driverId = "driver-1" as DriverId;

    const workId = await startWork.execute(
      driverId,
      new Date("2025-01-01T09:00:00Z"),
      new Date()
    );
    await closeWork.execute(driverId, new Date("2025-01-01T12:00:00Z"));

    await correctWork.execute({
      driverId,
      workPeriodId: workId,
      correctionId: "corr-1" as any,
      correctedStartTime: new Date("2025-01-01T10:00:00Z"),
      correctedEndTime: new Date("2025-01-01T13:00:00Z"),
      now: new Date(),
    });

    await correctWork.execute({
      driverId,
      workPeriodId: workId,
      correctionId: "corr-2" as any,
      correctedStartTime: new Date("2025-01-01T09:30:00Z"),
      correctedEndTime: new Date("2025-01-01T13:30:00Z"),
      now: new Date(),
    });

    const corrections = await correctionRepo.findByWorkPeriodId(workId);
    expect(corrections).toHaveLength(2);
  });
});
