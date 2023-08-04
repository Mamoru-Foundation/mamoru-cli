import { Command } from 'commander'
import { Logger } from '../services/console'
import path from 'path'
import { OUT_DIR } from '../services/constants'
import { validateAndParseParameterFlag } from '../utils/utils'

export interface PublishOptions {
    rpc?: string
    privateKey: string
    gas?: string
    parameters?: string
}

async function publishPlaybook(
    program: Command,
    projectPath: string,
    options: PublishOptions
) {
    const verbosity = program.opts().verbose
    const logger = new Logger(verbosity)
    logger.verbose(`PublishOptions ${JSON.stringify(options, null, 2)}`)
    const buildPath = path.join(projectPath, OUT_DIR)
    const parameterValues = validateAndParseParameterFlag(options.parameters)

    logger.ok('Publishing to Validation chain')
    const playbookId = 'test'
    return {
        playbookId,
    }
}

export default {
    publishPlaybook,
}
