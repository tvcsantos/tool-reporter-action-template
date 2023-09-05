import * as core from '@actions/core'
import { extendedContext } from '../github/extended-context'

// TODO Add or change inputs as required
export interface Inputs {
  file: string
  modes: Set<ModeOption>
  token: string
  showFilename: boolean
  failOnError: boolean
}

// TODO Add or change inputs as required
export enum Input {
  FILE = 'file',
  SHOW_FILENAME = 'show-filename',
  MODES = 'modes',
  GITHUB_TOKEN = 'token',
  FAIL_ON_ERROR = 'fail-on-error'
}

export enum ModeOption {
  PR_COMMENT = 'pr-comment',
  CHECK = 'check',
  SUMMARY = 'summary'
}

export function gatherInputs(): Inputs {
  // TODO adapt method to return your changed inputs if required
  const file = getInputFile()
  const modes = getInputModes()
  const token = getInputToken()
  const showFilename = getInputShowFilename()
  const failOnError = getInputFailOnError()
  return { file, modes, token, showFilename, failOnError }
}

function getInputFile(): string {
  return core.getInput(Input.FILE, { required: true })
}

function getInputShowFilename(): boolean {
  return core.getBooleanInput(Input.SHOW_FILENAME)
}

function internalGetInputModes(): ModeOption[] {
  const multilineInput = core.getMultilineInput(Input.MODES)
  return multilineInput
    .filter(x => !!x)
    .map(x => {
      if (!Object.values<string>(ModeOption).includes(x)) {
        throw new Error(
          `Invalid ${Input.MODES} option '${x}' on input '${JSON.stringify(
            multilineInput
          )}'`
        )
      }
      return x as ModeOption
    })
}

const NOT_IN_PR_CONTEXT_WARNING =
  "Selected 'pr-comment' mode but the action is not running in a pull request context. Ignoring this mode."
const NO_ADDITIONAL_MODE_SELECTED_USE_CHECK =
  "No additional mode selected, using 'check' mode."

function getInputModes(): Set<ModeOption> {
  const modes = new Set(internalGetInputModes())
  const isPullRequest = extendedContext.isPullRequest()
  if (modes.size <= 0) {
    if (isPullRequest) {
      modes.add(ModeOption.PR_COMMENT)
    }
    modes.add(ModeOption.CHECK)
  }
  if (modes.has(ModeOption.PR_COMMENT) && !isPullRequest) {
    core.warning(NOT_IN_PR_CONTEXT_WARNING)
    modes.delete(ModeOption.PR_COMMENT)
    if (modes.size <= 0) {
      core.warning(NO_ADDITIONAL_MODE_SELECTED_USE_CHECK)
      modes.add(ModeOption.CHECK)
    }
  }
  return modes
}

function getInputToken(): string {
  return core.getInput(Input.GITHUB_TOKEN, { required: true })
}

function getInputFailOnError(): boolean {
  return core.getBooleanInput(Input.FAIL_ON_ERROR)
}

// TODO Add methods for your extra inputs
// Pattern: function getInput<input-name>(): <type>
