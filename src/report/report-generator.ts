import { ReportResult } from '../model/report-result'
import { ReportProperties } from './report-properties'

export interface ReportGenerator<D> {
  generateReport(
    reportData: D,
    properties: ReportProperties
  ): Promise<ReportResult>
}
