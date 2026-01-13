import express from "express";
import { config } from "dotenv";

// ======================================================================
// Infrastructure – Repositories
// ======================================================================
import { PrismaWorkPeriodRepository } from "./infrastructure/repositories/PrismaWorkPeriodRepository";
import { PrismaWorkCorrectionRepository } from "./infrastructure/repositories/PrismaWorkCorrectionRepository";
import { PrismaLeaveRepository } from "./infrastructure/repositories/PrismaLeaveRepository";
import { PrismaLeaveCorrectionRepository } from "./infrastructure/repositories/PrismaLeaveCorrectionRepository";
import { PrismaShiftTransferRepository } from "./infrastructure/repositories/PrismaShiftTransferRepository";
import { PrismaDriverRepository } from "./infrastructure/repositories/PrismaDriverRepository";
import { PrismaAuthIdentityRepository } from "./infrastructure/repositories/PrismaAuthIdentityRepository";

// ======================================================================
// Infrastructure – Auth
// ======================================================================
import { GoogleTokenVerifierImpl } from "./infrastructure/auth/GoogleTokenVerifierImpl";
import { JwtServiceImpl } from "./infrastructure/auth/JwtServiceImpl";

// ======================================================================
// Infrastructure – Transaction
// ======================================================================
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
import { AuthenticateDriverService } from "./application/services/auth/AuthenticateDriverService";

// ======================================================================
// Application Services (Queries)
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
import { AuthenticateDriverController } from "./interfaces/http/controllers/auth/AuthenticateDriverController";

// ======================================================================
// Routes
// ======================================================================
import { createWorkRoutes } from "./interfaces/http/routes/work.routes";
import { createLeaveRoutes } from "./interfaces/http/routes/leave.routes";
import { createTransferRoutes } from "./interfaces/http/routes/transfer.routes";
import { createAnalyticsRoutes } from "./interfaces/http/routes/analytics.routes";
import { createAuthRoutes } from "./interfaces/http/routes/auth.routes";

// ======================================================================
// Middleware
// ======================================================================
import { requireAuth } from "./interfaces/http/middlewares/requireAuth";

// ======================================================================
// Bootstrap
// ======================================================================
config();

export const app = express();
app.use(express.json());

// ======================================================================
// Dependency Injection (Composition Root)
// ======================================================================

// --------------------
// Repositories
// --------------------
const workPeriodRepository = new PrismaWorkPeriodRepository();
const workCorrectionRepository = new PrismaWorkCorrectionRepository();
const leaveRepository = new PrismaLeaveRepository();
const leaveCorrectionRepository = new PrismaLeaveCorrectionRepository();
const shiftTransferRepository = new PrismaShiftTransferRepository();

const driverRepository = new PrismaDriverRepository();
const authIdentityRepository = new PrismaAuthIdentityRepository();

// --------------------
// Transaction Manager
// --------------------
const transactionManager = new PrismaTransactionManager();

// --------------------
// Auth Infrastructure
// --------------------
const googleTokenVerifier =
  new GoogleTokenVerifierImpl(process.env.GOOGLE_CLIENT_ID!);

const jwtService =
  new JwtServiceImpl(process.env.JWT_SECRET!);

// Auth middleware instance
const authMiddleware = requireAuth(jwtService);

// --------------------
// Command Services
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

const authenticateDriverService =
  new AuthenticateDriverService(
    transactionManager,
    googleTokenVerifier,
    jwtService,
    driverRepository,
    authIdentityRepository
  );

// --------------------
// Query Services
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

// Auth
const authenticateDriverController =
  new AuthenticateDriverController(authenticateDriverService);

// ======================================================================
// Routes
// ======================================================================

// Public
app.get("/health", (_, res) => {
  res.json({ status: "ok" });
});

app.use(
  "/auth",
  createAuthRoutes(authenticateDriverController)
);

// Protected
app.use(
  "/work",
  authMiddleware,
  createWorkRoutes(
    startWorkController,
    closeWorkController,
    correctWorkController
  )
);

app.use(
  "/leave",
  authMiddleware,
  createLeaveRoutes(
    recordLeaveController,
    leaveCorrectionController
  )
);

app.use(
  "/transfer",
  authMiddleware,
  createTransferRoutes(
    recordShiftTransferController
  )
);

app.use(
  "/analytics",
  authMiddleware,
  createAnalyticsRoutes(
    getLeaveCountSummaryController,
    getWorkSummaryController
  )
);

app.use((err: any, req: any, res: any, next: any) => {
  console.error("❌ Unhandled error in controller:");
  console.error(err);
  
  res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: err.message || "Internal server error",
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }
  });
});

// ======================================================================
// Server
// ======================================================================

const PORT = process.env.PORT || 3000;

// Only start server if run directly (not during tests)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
