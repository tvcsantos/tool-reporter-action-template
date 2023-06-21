import {ReportResult} from '../model/report-result'
import {ReportProperties} from './report-properties'

export interface ReportGenerator {
  generateReport(
    path: string,
    properties: ReportProperties
  ): Promise<ReportResult>
}
