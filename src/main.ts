import * as core from '@actions/core'
import {gatherInputs} from './input/inputs'
import {ActionOrchestrator} from './action/action-orchestrator'

async function run(): Promise<void> {
  const inputs = gatherInputs()
  return new ActionOrchestrator().execute(inputs)
}

// eslint-disable-next-line github/no-then
run().catch(error => {
  core.error(error)
  if (error instanceof Error) {
    core.setFailed(error.message)
  }
})
