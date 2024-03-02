import { Reporter } from './reporter'
import { GitHubPRCommenter } from '../github/comment'
import { ReportResult } from '../model/report-result'

export class CommentReporter implements Reporter {
  maxSize = null

  constructor(
    private readonly gitHubPRCommenter: GitHubPRCommenter,
    private readonly commentOnSuccess: boolean
  ) {}

  async report(data: ReportResult): Promise<void> {
    if (data.failed || this.commentOnSuccess) {
      await this.gitHubPRCommenter.comment(data.report)
    }
  }
}
