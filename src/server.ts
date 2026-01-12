import express from "express";
import { config } from "dotenv";

// ======================================================================
// Infrastructure
// ======================================================================
import { PrismaWorkPeriodRepository } from "./infrastructure/repositories/PrismaWorkPeriodRepository";
import { PrismaWorkCorrectionRepository } from "./infrastructure/repositories/PrismaWorkCorrectionRepository";
import { PrismaLeaveRepository } from "./infrastructure/repositories/PrismaLeaveRepository";
import { PrismaLeaveCorrectionRepository } from "./infrastructure/repositories/PrismaLeaveCorrectionRepository";
import { PrismaShiftTransferRepository } from "./infrastructure/repositories/PrismaShiftTransferRepository";
import { PrismaTransactionManager } from "./infrastructure/prisma/PrismaTransactionManager";

// ======================================================================
// Application Services (Commands)
// ======================================================================
import { StartWorkService } from "./application/services/work/StartWorkService";
import { CloseWorkService } from "./application/services/work/CloseWorkService";
import { CorrectWorkService } from "./application/services/work/CorrectWorkService";

import { RecordLeaveService } from "./application/services/leave/RecordLeaveService";
import { LeaveCorrectionService } from "./application/services/leave/LeaveCorrectionService";

import { RecordShiftTransferService } from "./application/services/transfer/RecordShiftTransferService";

// ======================================================================
// Application Services (Queries / Analytics)
// ======================================================================
import { GetLeaveCountSummaryService } from "./application/services/analytics/GetLeaveCountSummaryService";
import { GetWorkSummaryService } from "./application/services/analytics/GetWorkSummaryService";

// ======================================================================
// Controllers
// ======================================================================
import { StartWorkController } from "./interfaces/http/controllers/work/StartWorkController";
import { CloseWorkController } from "./interfaces/http/controllers/work/CloseWorkController";
import { CorrectWorkController } from "./interfaces/http/controllers/work/CorrectWorkController";

import { RecordLeaveController } from "./interfaces/http/controllers/leave/RecordLeaveController";
import { LeaveCorrectionController } from "./interfaces/http/controllers/leave/LeaveCorrectionController";

import { RecordShiftTransferController } from "./interfaces/http/controllers/transfer/RecordShiftTransferController";

import { GetLeaveCountSummaryController } from "./interfaces/http/controllers/analytics/GetLeaveCountSummaryController";
import { GetWorkSummaryController } from "./interfaces/http/controllers/analytics/GetWorkSummaryController";

// ======================================================================
// Routes
// ======================================================================
import { createWorkRoutes } from "./interfaces/http/routes/work.routes";
import { createLeaveRoutes } from "./interfaces/http/routes/leave.routes";
import { createTransferRoutes } from "./interfaces/http/routes/transfer.routes";
import { createAnalyticsRoutes } from "./interfaces/http/routes/analytics.routes";

// ======================================================================
// Bootstrap
// ======================================================================
config();

export const app = express();
app.use(express.json());

// ======================================================================
// Dependency Injection (Composition Root)
// ======================================================================

// Repositories
const workPeriodRepository = new PrismaWorkPeriodRepository();
const workCorrectionRepository = new PrismaWorkCorrectionRepository();
const leaveRepository = new PrismaLeaveRepository();
const leaveCorrectionRepository = new PrismaLeaveCorrectionRepository();
const shiftTransferRepository = new PrismaShiftTransferRepository();

// Transaction manager
const transactionManager = new PrismaTransactionManager();

// --------------------
// Command services
// --------------------
const startWorkService =
  new StartWorkService(
    workPeriodRepository,
    transactionManager
  );

const closeWorkService =
  new CloseWorkService(
    workPeriodRepository,
    leaveRepository,
    leaveCorrectionRepository,
    transactionManager
  );

const correctWorkService =
  new CorrectWorkService(
    workPeriodRepository,
    workCorrectionRepository,
    leaveRepository,
    leaveCorrectionRepository,
    transactionManager
  );

const recordLeaveService =
  new RecordLeaveService(
    leaveRepository,
    workPeriodRepository,
    workCorrectionRepository,
    transactionManager
  );

const leaveCorrectionService =
  new LeaveCorrectionService(
    leaveRepository,
    leaveCorrectionRepository,
    workPeriodRepository,
    transactionManager
  );

const recordShiftTransferService =
  new RecordShiftTransferService(
    shiftTransferRepository,
    transactionManager
  );

// --------------------
// Query services
// --------------------
const getLeaveCountSummaryService =
  new GetLeaveCountSummaryService(
    leaveRepository,
    leaveCorrectionRepository
  );

const getWorkSummaryService =
  new GetWorkSummaryService(
    workPeriodRepository,
    workCorrectionRepository
  );

// ======================================================================
// Controllers
// ======================================================================

// Work
const startWorkController =
  new StartWorkController(startWorkService);

const closeWorkController =
  new CloseWorkController(closeWorkService);

const correctWorkController =
  new CorrectWorkController(correctWorkService);

// Leave
const recordLeaveController =
  new RecordLeaveController(recordLeaveService);

const leaveCorrectionController =
  new LeaveCorrectionController(leaveCorrectionService);

// Transfer
const recordShiftTransferController =
  new RecordShiftTransferController(recordShiftTransferService);

// Analytics
const getLeaveCountSummaryController =
  new GetLeaveCountSummaryController(getLeaveCountSummaryService);

const getWorkSummaryController =
  new GetWorkSummaryController(getWorkSummaryService);

// ======================================================================
// Routes
// ======================================================================

app.get("/health", (_, res) => {
  res.json({ status: "ok" });
});

app.use(
  "/work",
  createWorkRoutes(
    startWorkController,
    closeWorkController,
    correctWorkController
  )
);

app.use(
  "/leave",
  createLeaveRoutes(
    recordLeaveController,
    leaveCorrectionController
  )
);

app.use(
  "/transfer",
  createTransferRoutes(
    recordShiftTransferController
  )
);

app.use(
  "/analytics",
  createAnalyticsRoutes(
    getLeaveCountSummaryController,
    getWorkSummaryController
  )
);

// ======================================================================
// Server
// ======================================================================


const PORT = process.env.PORT || 3000;

// Only start server if this file is run directly (not imported by tests)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}