

import { confirm } from '@inquirer/prompts'
import { RcConfig } from '../types'
import rc = require('rc');

export type AskForTelemetryOptions = {
  skipTelemetry?: boolean
}


export function askForTelemetry(rcConfig: RcConfig, askForTelemetryOptions: AskForTelemetryOptions) {
  if (rcConfig.telemetry === false) {
    return
  }
  if (askForTelemetryOptions.skipTelemetry) {
    return
  }

  if (!rcConfig.telemetry) {
    const shouldTelemetry = confirm({

      message: 'May we anonymously report usage statistics to improve the tool over time?',
    }).then((answers: any) => {
      rcConfig.telemetry = answers.telemetry
    })


  }
}