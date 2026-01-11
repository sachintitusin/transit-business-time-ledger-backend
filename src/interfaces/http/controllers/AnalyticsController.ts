import { Request, Response, NextFunction } from 'express'
import { TimeRange } from '../../../domain/shared/TimeRange'
import { DriverId } from '../../../domain/shared/types'
import { GetWorkSummaryService } from '../../../application/services/analytics/GetWorkSummaryService'
import { GetLeaveCountSummaryService } from '../../../application/services/analytics/GetLeaveCountSummaryService'
import { ShiftTransferCountSummary } from '../../../domain/analytics/ShiftTransferCountSummary'
import { AcceptedShiftCountSummary } from '../../../domain/analytics/AcceptedShiftCountSummary'
import { ShiftTransferRepository } from '../../../application/ports/ShiftTransferRepository'

export class AnalyticsController {
  constructor(
    private readonly getWorkSummaryService: GetWorkSummaryService,
    private readonly getLeaveCountService: GetLeaveCountSummaryService,
    private readonly shiftTransferRepo: ShiftTransferRepository
  ) {}

  handleGetWorkSummary = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { driverId, start, end } = req.query

      const range = TimeRange.create(
        new Date(start as string),
        new Date(end as string)
      )

      const result =
        await this.getWorkSummaryService.execute(
          driverId as DriverId,
          range
        )

      res.json(result)
    } catch (err) {
      next(err)
    }
  }

  handleGetLeaveCount = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { driverId, start, end } = req.query

      const range = TimeRange.create(
        new Date(start as string),
        new Date(end as string)
      )

      const result =
        await this.getLeaveCountService.execute(
          driverId as DriverId,
          range
        )

      res.json(result)
    } catch (err) {
      next(err)
    }
  }

  handleGetShiftTransferCount = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { driverId, start, end } = req.query

      const range = TimeRange.create(
        new Date(start as string),
        new Date(end as string)
      )

      const events =
        await this.shiftTransferRepo.findByDriverAndRange(
          driverId as DriverId,
          range
        )

      const result =
        ShiftTransferCountSummary.calculate(range, events)

      res.json(result)
    } catch (err) {
      next(err)
    }
  }

  handleGetAcceptedShiftCount = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { driverId, start, end } = req.query

      const range = TimeRange.create(
        new Date(start as string),
        new Date(end as string)
      )

      const events =
        await this.shiftTransferRepo.findByDriverAndRange(
          driverId as DriverId,
          range
        )

      const result =
        AcceptedShiftCountSummary.calculate(
          range,
          driverId as DriverId,
          events
        )

      res.json(result)
    } catch (err) {
      next(err)
    }
  }
}
