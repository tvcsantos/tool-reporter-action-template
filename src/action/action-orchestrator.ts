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
import {ContextExtensions} from '../github/utils'

const NOT_IN_PR_CONTEXT_WARNING =
  "Selected 'pr-comment' mode but the action is not running in a pull request context. Switching to 'summary' mode."

export class ActionOrchestrator {
  private gitHubCheck: GitHubCheck | null = null
  private inputs?: Inputs

  private getOctokit(): InstanceType<typeof GitHub> {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return github.getOctokit(this.inputs!!.token)
  }

  private async getReporter(): Promise<Reporter> {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    let mode = this.inputs!!.mode
    const contextExtensions = ContextExtensions.of(github.context)
    if (mode === ModeOption.PR_COMMENT && !contextExtensions.isPullRequest()) {
      core.warning(NOT_IN_PR_CONTEXT_WARNING)
      mode = ModeOption.SUMMARY
    }
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

  async execute(inputs: Inputs): Promise<void> {
    this.inputs = inputs
    const reporter = await this.getReporter()
    try {
      const reportGenerator = KubeconformReportGenerator.getInstance()
      const reportResult = await reportGenerator.generateReport(
        this.inputs.file,
        {showFilename: this.inputs.showFilename}
      )
      await reporter.report(reportResult)
    } catch (e) {
      this.gitHubCheck?.cancel()
      throw e
    }
  }
}
