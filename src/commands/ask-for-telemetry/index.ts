import { confirm } from '@inquirer/prompts'
import { RcConfig } from '../../types'
import { writeRcConfig, readRcConfig } from '../../services/config'
import * as Sentry from '@sentry/node'

export type AskForTelemetryOptions = {
    skipTelemetry?: boolean
}

export async function askForTelemetry(
    askForTelemetryOptions: AskForTelemetryOptions
) {
    try {
        if (askForTelemetryOptions.skipTelemetry) {
            return
        }
        const rcConfig = readRcConfig()

        if (rcConfig.telemetry === false) {
            return
        }

        if (rcConfig.telemetry === true) {
            startTelemetry(rcConfig)
            return
        }

        if (rcConfig.telemetry === undefined) {
            const telemetry = await confirm({
                message:
                    'May we anonymously report usage statistics to improve the tool over time?',
            })
            rcConfig.telemetry = telemetry

            writeRcConfig(rcConfig)
            if (telemetry) {
                startTelemetry(rcConfig)
            }
        }
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('There was an error while asking for telemetry, skipping')
    }
}

function startTelemetry(rcConfig: RcConfig) {
    if (!rcConfig.telemetry) return
    Sentry.init({
        dsn: 'https://0dd280de6b9443419c5ae4d105ae4f78@o4505192379187200.ingest.sentry.io/4505525476851712',
        tracesSampleRate: 1.0,
    })
}
