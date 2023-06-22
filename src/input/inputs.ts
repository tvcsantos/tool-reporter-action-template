import * as core from '@actions/core'
import {contextExt} from '../github/utils'

// TODO Add or change inputs as required
export interface Inputs {
  file: string
  modes: Set<ModeOption>
  token: string
  showFilename: boolean
}

// TODO Add or change inputs as required
export enum Input {
  FILE = 'file',
  SHOW_FILENAME = 'show-filename',
  MODES = 'modes',
  GITHUB_TOKEN = 'token'
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
  return {file, modes, token, showFilename}
}

function getInputFile(): string {
  return core.getInput(Input.FILE, {required: true})
}

function getInputShowFilename(): boolean {
  return core.getBooleanInput(Input.SHOW_FILENAME)
}

function internalGetInputModes(): ModeOption[] {
  const input = core.getInput(Input.MODES)
  return input
    .split(',')
    .map(x => x.trim())
    .filter(x => !!x)
    .map(x => {
      if (!Object.values<string>(ModeOption).includes(x)) {
        throw new Error(
          `Invalid ${Input.MODES} option '${x}' on input '${input}'`
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
  const isPullRequest = contextExt.isPullRequest()
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
  return core.getInput(Input.GITHUB_TOKEN, {required: true})
}

// TODO Add methods for your extra inputs
// Pattern: function getInput<input-name>(): <type>
