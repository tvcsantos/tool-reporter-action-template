import {GitHubCheck} from '../github/check'
import {Reporter} from './reporter'
import {ReportResult} from '../model/report-result'

// TODO change with a FAIL message for your summary
const FAIL_SUMMARY = 'Manifests found that are not valid!'
// TODO change with a SUCCESS message for your summary
const SUCCESS_SUMMARY = 'No invalid manifests!'

export class CheckReporter implements Reporter {
  private gitHubCheck: GitHubCheck

  constructor(gitHubCheck: GitHubCheck) {
    this.gitHubCheck = gitHubCheck
  }

  async report(data: ReportResult): Promise<void> {
    if (data.failed) {
      await this.gitHubCheck.fail(FAIL_SUMMARY, data.report)
    } else {
      await this.gitHubCheck.pass(SUCCESS_SUMMARY, data.report)
    }
  }
}
