import { KubeconformResult, KubeconformResultEntry } from '../model/kubeconform'
import { ReportResult } from '../model/report-result'
import { ReportGenerator } from './report-generator'
import { ReportProperties } from './report-properties'
import { noBreak } from '../utils/utils'
import { TextBuilder } from './text-builder'
import { ReportLine } from '../model/report-line'

// TODO change all constants below with your reporting format and messages
const HEADER = (showFilename: boolean): string =>
  `${showFilename ? '| Filename ' : ''}| Name | Kind | Version | Message |`
const HEADER_ALIGNMENT = (showFilename: boolean): string =>
  `${showFilename ? '|-' : ''}|-|-|-|-|`
const SUCCESS_COMMENT =
  '# :white_check_mark: Kubeconform - All Kubernetes manifests are valid!'
const FAIL_COMMENT = '# :x: Kubeconform - Invalid Kubernetes manifests found!'

// TODO change this class with and implementation for your report generator
export class KubeconformReportGenerator
  implements ReportGenerator<KubeconformResult>
{
  private constructor() {}

  private makeReportLine(
    line: ReportLine,
    properties: ReportProperties
  ): string {
    const filename = properties.showFilename
      ? `| ${noBreak(line.filename)} `
      : ''
    return `${filename}| ${noBreak(line.name)} | ${noBreak(
      line.kind
    )} | ${noBreak(line.version)} | ${line.message} |`
  }

  private addTitleToTextBuilder(textBuilder: TextBuilder): void {
    textBuilder.addLines(FAIL_COMMENT)
  }

  private addHeaderToTextBuilder(
    textBuilder: TextBuilder,
    reportProperties: ReportProperties
  ): void {
    textBuilder.addLines(
      HEADER(reportProperties.showFilename),
      HEADER_ALIGNMENT(reportProperties.showFilename)
    )
  }

  private async addContentToTextBuilder(
    textBuilder: TextBuilder,
    entries: KubeconformResultEntry[],
    reportProperties: ReportProperties
  ): Promise<boolean> {
    let isContentTruncated = false
    for (const entry of entries) {
      const line: ReportLine = {
        name: entry.name,
        kind: entry.kind,
        version: entry.version,
        message: entry.msg,
        filename: entry.filename
      }
      const theReportLine = this.makeReportLine(line, reportProperties)
      const addedLines = textBuilder.tryAddLines(theReportLine)
      if (!addedLines) {
        isContentTruncated = true
        break
      }
    }
    return isContentTruncated
  }

  async generateReport(
    reportData: KubeconformResult,
    properties: ReportProperties
  ): Promise<ReportResult> {
    const resources: KubeconformResultEntry[] = reportData.resources ?? []

    if (resources.length <= 0) {
      return { report: SUCCESS_COMMENT, failed: false, truncated: false }
    }

    const textBuilder = new TextBuilder(properties.maxSize)

    this.addTitleToTextBuilder(textBuilder)
    this.addHeaderToTextBuilder(textBuilder, properties)
    const result = await this.addContentToTextBuilder(
      textBuilder,
      resources,
      properties
    )

    return { report: textBuilder.build(), failed: true, truncated: result }
  }

  private static instance: KubeconformReportGenerator | null

  static getInstance(): KubeconformReportGenerator {
    if (!KubeconformReportGenerator.instance) {
      KubeconformReportGenerator.instance = new KubeconformReportGenerator()
    }
    return KubeconformReportGenerator.instance
  }
}
