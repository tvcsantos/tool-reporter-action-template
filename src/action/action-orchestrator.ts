import { GitHubCheck, GitHubCheckCreator } from '../github/check'
import { Inputs, ModeOption } from '../input/inputs'
import { Reporter } from '../report/reporter'
import * as github from '@actions/github'
import { CommentReporter } from '../report/comment-reporter'
import { GitHubPRCommenter } from '../github/comment'
import { APPLICATION_NAME, CHECK_NAME } from './constants'
import { CheckReporter } from '../report/check-reporter'
import { SummaryReporter } from '../report/summary-reporter'
import * as core from '@actions/core'
import { GitHub } from '@actions/github/lib/utils'
import { KubeconformReportGenerator } from '../report/kubeconform-report-generator'
import fs from 'fs/promises'
import { extendedContext } from '../github/extended-context'
import { KubeconformResult } from '../model/kubeconform'
import { ReportResult } from '../model/report-result'

const FILE_ENCODING = 'utf-8'

export class ActionOrchestrator {
  private octokit!: InstanceType<typeof GitHub>
  private gitHubCheck: GitHubCheck | null = null
  private inputs!: Inputs

  private getOctokit(): InstanceType<typeof GitHub> {
    return github.getOctokit(this.inputs.token)
  }

  private async getReporter(
    mode: ModeOption,
    commentPrOnSuccess: boolean
  ): Promise<Reporter> {
    switch (mode) {
      case ModeOption.PR_COMMENT:
        return new CommentReporter(
          new GitHubPRCommenter(
            APPLICATION_NAME,
            this.octokit,
            extendedContext
          ),
          commentPrOnSuccess
        )
      case ModeOption.CHECK: {
        const gitHubCheckCreator = new GitHubCheckCreator(
          this.octokit,
          extendedContext
        )
        this.gitHubCheck = await gitHubCheckCreator.create(CHECK_NAME)
        return new CheckReporter(this.gitHubCheck)
      }
      case ModeOption.SUMMARY:
        return new SummaryReporter(core.summary)
    }
  }

  private async getReporters(): Promise<Reporter[]> {
    const modes = this.inputs.modes
    const commentPrOnSuccess = this.inputs.commentPrOnSuccess
    const result: Reporter[] = []
    for (const mode of modes) {
      result.push(await this.getReporter(mode, commentPrOnSuccess))
    }
    return result
  }

  private async parseReport(): Promise<KubeconformResult> {
    const fileContents = await fs.readFile(this.inputs.file, {
      encoding: FILE_ENCODING
    })
    return JSON.parse(fileContents) as KubeconformResult
  }

  private async doReports(
    reportData: KubeconformResult,
    reporters: Reporter[]
  ): Promise<boolean> {
    const reportGenerator = KubeconformReportGenerator.getInstance()
    const reportResults = new Map<number | null, ReportResult>()
    let failed = false

    for (const reporter of reporters) {
      let reportResult = reportResults.get(reporter.maxSize)

      if (reportResult === undefined) {
        reportResult = await reportGenerator.generateReport(reportData, {
          maxSize: reporter.maxSize ?? undefined,
          showFilename: this.inputs.showFilename
        })
        reportResults.set(reporter.maxSize, reportResult)
      }

      failed ||= reportResult.failed

      await reporter.report(reportResult)
    }

    return failed
  }

  async execute(inputs: Inputs): Promise<number> {
    this.inputs = inputs
    this.octokit = this.getOctokit()
    const reporters = await this.getReporters()
    try {
      const report = await this.parseReport()

      const failed = await this.doReports(report, reporters)

      return failed && this.inputs.failOnError ? 1 : 0
    } catch (e) {
      this.gitHubCheck?.cancel()
      throw e
    }
  }
}
