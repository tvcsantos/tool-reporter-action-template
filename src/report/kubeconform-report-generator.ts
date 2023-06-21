import * as fs from 'fs/promises'
import {KubeconformResult, KubeconformResultEntry} from '../model/kubeconform'
import {ReportLine} from '../model/report-line'
import {ReportResult} from '../model/report-result'
import {ReportGenerator} from './report-generator'
import {ReportProperties} from './report-properties'
import {noBreak} from '../utils/utils'

// TODO change all constants below with your reporting format and messages
const HEADER = (showFilename: boolean): string =>
  `${showFilename ? '| Filename ' : ''}| Name | Kind | Version | Message |`
const HEADER_ALIGNMENT = (showFilename: boolean): string =>
  `${showFilename ? '|-' : ''}|-|-|-|-|`
const FILE_ENCODING = 'utf-8'
const SUCCESS_COMMENT =
  '# :white_check_mark: All Kubernetes manifests are valid!'
const FAIL_COMMENT = '# :x: Invalid Kubernetes manifests found!'

// TODO change this class with and implementation for your report generator
export class KubeconformReportGenerator implements ReportGenerator {
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

  async generateReport(
    path: string,
    properties: ReportProperties
  ): Promise<ReportResult> {
    const result = await fs.readFile(path, FILE_ENCODING)
    const kubeconformResult = JSON.parse(result) as KubeconformResult

    const reportTable: string[] = []

    const resources: KubeconformResultEntry[] =
      kubeconformResult.resources ?? []

    if (resources.length <= 0) return {report: SUCCESS_COMMENT, failed: false}

    reportTable.push(FAIL_COMMENT)
    reportTable.push(HEADER(properties.showFilename))
    reportTable.push(HEADER_ALIGNMENT(properties.showFilename))

    for (const resource of resources) {
      const line: ReportLine = {
        name: resource.name,
        kind: resource.kind,
        version: resource.version,
        message: resource.msg,
        filename: resource.filename
      }
      reportTable.push(this.makeReportLine(line, properties))
    }

    return {report: reportTable.join('\n'), failed: true}
  }

  private static instance: KubeconformReportGenerator | null

  static getInstance(): KubeconformReportGenerator {
    if (!KubeconformReportGenerator.instance) {
      KubeconformReportGenerator.instance = new KubeconformReportGenerator()
    }
    return KubeconformReportGenerator.instance
  }
}
