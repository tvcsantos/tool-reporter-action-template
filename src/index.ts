import * as core from '@actions/core'
import { gatherInputs } from './input/inputs'
import { ActionOrchestrator } from './action/action-orchestrator'

async function run(): Promise<void> {
  const inputs = gatherInputs()
  const exitCode = await new ActionOrchestrator().execute(inputs)
  if (exitCode !== 0) {
    core.setFailed(`Reporter exited with code ${exitCode}, failing...`)
  }
}

// eslint-disable-next-line github/no-then
run().catch(error => {
  core.error(error)
  if (error instanceof Error) {
    core.setFailed(error.message)
  }
})
