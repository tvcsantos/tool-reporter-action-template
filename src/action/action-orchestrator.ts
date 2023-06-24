import {GitHubCheck, GitHubCheckCreator} from '../github/check'
import {Inputs, ModeOption} from '../input/inputs'
import {Reporter} from '../report/reporter'
import * as github from '@actions/github'
import {CommentReporter} from '../report/comment-reporter'
import {GitHubPRCommenter} from '../github/comment'
import {APPLICATION_NAME, CHECK_NAME} from './constants'
import {CheckReporter} from '../report/check-reporter'
import {SummaryReporter} from '../report/summary-reporter'
import * as core from '@actions/core'
import {GitHub} from '@actions/github/lib/utils'
import {KubeconformReportGenerator} from '../report/kubeconform-report-generator'

export class ActionOrchestrator {
  private gitHubCheck: GitHubCheck | null = null
  private inputs?: Inputs

  private getOctokit(): InstanceType<typeof GitHub> {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return github.getOctokit(this.inputs!!.token)
  }

  private async getReporter(mode: ModeOption): Promise<Reporter> {
    switch (mode) {
      case ModeOption.PR_COMMENT:
        return new CommentReporter(
          new GitHubPRCommenter(
            APPLICATION_NAME,
            this.getOctokit(),
            github.context
          )
        )
      case ModeOption.CHECK: {
        const gitHubCheckCreator = new GitHubCheckCreator(
          this.getOctokit(),
          github.context
        )
        this.gitHubCheck = await gitHubCheckCreator.create(CHECK_NAME)
        return new CheckReporter(this.gitHubCheck)
      }
      case ModeOption.SUMMARY:
        return new SummaryReporter(core.summary)
    }
  }

  private async getReporters(): Promise<Reporter[]> {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const modes = this.inputs!!.modes
    const result: Reporter[] = []
    for (const mode of modes) {
      result.push(await this.getReporter(mode))
    }
    return result
  }

  async execute(inputs: Inputs): Promise<number> {
    this.inputs = inputs
    const reporters = await this.getReporters()
    try {
      const reportGenerator = KubeconformReportGenerator.getInstance()
      const reportResult = await reportGenerator.generateReport(
        this.inputs.file,
        {showFilename: this.inputs.showFilename}
      )
      for (const reporter of reporters) {
        await reporter.report(reportResult)
      }
      return reportResult.failed && this.inputs.failOnError ? 1 : 0
    } catch (e) {
      this.gitHubCheck?.cancel()
      throw e
    }
  }
}
