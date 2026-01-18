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
// Infrastructure – Logging
// ======================================================================
import { PinoAppLogger } from "./infrastructure/logging/PinoAppLogger";

// ======================================================================
// Infrastructure – Transaction
// ======================================================================
import { PrismaTransactionManager } from "./infrastructure/prisma/PrismaTransactionManager";

// ======================================================================
// Application Policies
// ======================================================================
import { MaxShiftDurationPolicy } from "./application/policies/MaxShiftDurationPolicy";

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
import { GetDailyAnalyticsService } from "./application/services/analytics/GetDailyAnalyticsService";
import { GetMeService } from "./application/services/auth/GetMeService";
import { GetEntriesService } from "./application/services/entries/GetEntriesService";
import { GetEntryByIdService } from "./application/services/entries/GetEntryByIdService";

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
import { GetDailyAnalyticsController } from "./interfaces/http/controllers/analytics/GetDailyAnalyticsController";
import { AuthenticateDriverController } from "./interfaces/http/controllers/auth/AuthenticateDriverController";
import { GetMeController } from "./interfaces/http/controllers/me/GetMeController";
import { GetWorkStatusController } from "./interfaces/http/controllers/work/GetWorkStatusController";
import { GetEntriesController } from "./interfaces/http/controllers/entries/GetEntriesController";
import { GetEntryByIdController } from "./interfaces/http/controllers/entries/GetEntryByIdController";

// ======================================================================
// Routes
// ======================================================================
import { createWorkRoutes } from "./interfaces/http/routes/work.routes";
import { createLeaveRoutes } from "./interfaces/http/routes/leave.routes";
import { createTransferRoutes } from "./interfaces/http/routes/transfer.routes";
import { createAnalyticsRoutes } from "./interfaces/http/routes/analytics.routes";
import { createAuthRoutes } from "./interfaces/http/routes/auth.routes";
import { createMeRoutes } from "./interfaces/http/routes/me.routes";
import { createWorkStatusRoutes } from "./interfaces/http/routes/workStatus.routes";
import { createEntriesRoutes } from "./interfaces/http/routes/entries.routes";

// ======================================================================
// Middleware
// ======================================================================
import { requireAuth } from "./interfaces/http/middlewares/requireAuth";
import { errorHandler } from "./interfaces/http/middlewares/errorHandler";
import { GetWorkStatusService } from "./domain/work/GetWorkStatusService";

// ======================================================================
// Bootstrap
// ======================================================================
config();

export const app = express();
app.use(express.json());

// ======================================================================
// Logger
// ======================================================================
const logger = new PinoAppLogger();

// ======================================================================
// Dependency Injection (Composition Root)
// ======================================================================

// Repositories
const workPeriodRepository = new PrismaWorkPeriodRepository();
const workCorrectionRepository = new PrismaWorkCorrectionRepository();
const leaveRepository = new PrismaLeaveRepository();
const leaveCorrectionRepository = new PrismaLeaveCorrectionRepository();
const shiftTransferRepository = new PrismaShiftTransferRepository();

const driverRepository = new PrismaDriverRepository();
const authIdentityRepository = new PrismaAuthIdentityRepository();

// Transaction manager
const transactionManager = new PrismaTransactionManager();

// Policies
const maxShiftDurationPolicy = new MaxShiftDurationPolicy();

// Auth
const googleTokenVerifier =
  new GoogleTokenVerifierImpl(process.env.GOOGLE_CLIENT_ID!);

const jwtService =
  new JwtServiceImpl(process.env.JWT_SECRET!);

const authMiddleware = requireAuth(jwtService);

// ======================================================================
// Command services
// ======================================================================
const startWorkService =
  new StartWorkService(workPeriodRepository, transactionManager, logger);

const closeWorkService =
  new CloseWorkService(
    workPeriodRepository,
    leaveRepository,
    leaveCorrectionRepository,
    transactionManager,
    maxShiftDurationPolicy,
    logger
  );

const correctWorkService =
  new CorrectWorkService(
    workPeriodRepository,
    workCorrectionRepository,
    leaveRepository,
    leaveCorrectionRepository,
    transactionManager,
    maxShiftDurationPolicy,
    logger
  );

const recordLeaveService =
  new RecordLeaveService(
    leaveRepository,
    workPeriodRepository,
    workCorrectionRepository,
    transactionManager,
    logger
  );

const leaveCorrectionService =
  new LeaveCorrectionService(
    leaveRepository,
    leaveCorrectionRepository,
    workPeriodRepository,
    transactionManager,
    logger
  );

const recordShiftTransferService =
  new RecordShiftTransferService(
    shiftTransferRepository,
    workPeriodRepository,
    transactionManager,
    logger
  );

const authenticateDriverService =
  new AuthenticateDriverService(
    transactionManager,
    googleTokenVerifier,
    jwtService,
    driverRepository,
    authIdentityRepository,
    logger
  );

// ======================================================================
// Query services
// ======================================================================
const getLeaveCountSummaryService =
  new GetLeaveCountSummaryService(
    leaveRepository,
    leaveCorrectionRepository,
    logger
  );

const getWorkSummaryService =
  new GetWorkSummaryService(
    workPeriodRepository,
    workCorrectionRepository,
    logger
  );

const getDailyAnalyticsService =
  new GetDailyAnalyticsService(
    workPeriodRepository,
    workCorrectionRepository,
    leaveRepository,
    leaveCorrectionRepository,
    logger
  );

const getMeService =
  new GetMeService(driverRepository, logger);

const getWorkStatusService =
  new GetWorkStatusService(workPeriodRepository);

const getEntriesService =
  new GetEntriesService(
    workPeriodRepository,
    workCorrectionRepository,
    leaveRepository,
    leaveCorrectionRepository,
    shiftTransferRepository,
    logger
  );

const getEntryByIdService =
  new GetEntryByIdService(
    workPeriodRepository,
    leaveRepository,
    logger
  );

// ======================================================================
// Controllers
// ======================================================================
const startWorkController = new StartWorkController(startWorkService);
const closeWorkController = new CloseWorkController(closeWorkService);
const correctWorkController = new CorrectWorkController(correctWorkService);
const recordLeaveController = new RecordLeaveController(recordLeaveService);
const leaveCorrectionController = new LeaveCorrectionController(leaveCorrectionService);
const recordShiftTransferController = new RecordShiftTransferController(recordShiftTransferService);

const getLeaveCountSummaryController =
  new GetLeaveCountSummaryController(getLeaveCountSummaryService);

const getWorkSummaryController =
  new GetWorkSummaryController(getWorkSummaryService);

const getDailyAnalyticsController =
  new GetDailyAnalyticsController(getDailyAnalyticsService);

const authenticateDriverController =
  new AuthenticateDriverController(authenticateDriverService);

const getMeController = new GetMeController(getMeService);
const getWorkStatusController = new GetWorkStatusController(getWorkStatusService);
const getEntriesController = new GetEntriesController(getEntriesService);
const getEntryByIdController = new GetEntryByIdController(getEntryByIdService);

// ======================================================================
// Routes
// ======================================================================
app.get("/health", (_, res) => res.json({ status: "ok" }));

app.use("/auth", createAuthRoutes(authenticateDriverController));
app.use("/me", authMiddleware, createMeRoutes(getMeController));

app.use(
  "/entries",
  authMiddleware,
  createEntriesRoutes(
    getEntriesController,
    getEntryByIdController
  )
);

app.use("/work", authMiddleware, createWorkStatusRoutes(getWorkStatusController));

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
  createTransferRoutes(recordShiftTransferController)
);

app.use(
  "/analytics",
  authMiddleware,
  createAnalyticsRoutes(
    getLeaveCountSummaryController,
    getWorkSummaryController,
    getDailyAnalyticsController
  )
);

// ======================================================================
// Global error handler (✅ CORRECT)
// ======================================================================
app.use(errorHandler);

// ======================================================================
// Server start
// ======================================================================
const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    logger.info("Server started", { port: PORT });
  });
}
