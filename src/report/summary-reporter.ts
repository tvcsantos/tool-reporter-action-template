import { summary } from '@actions/core'
import { Reporter } from './reporter'
import { ReportResult } from '../model/report-result'

export class SummaryReporter implements Reporter {
  maxSize = null

  constructor(private readonly theSummary: typeof summary) {}

  async report(data: ReportResult): Promise<void> {
    await this.theSummary.addRaw(data.report).write()
  }
}
