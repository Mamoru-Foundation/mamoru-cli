import { Command } from 'commander'
import { Logger } from '../services/console'
import path from 'path'
import { PLAYBOOK_FILES } from '../services/constants'
import ValidationChainService from '../services/validation-chain'
import { PlaybookDTO } from '@mamoru-ai/validation-chain-ts-client/dist/validationchain.validationchain/types/validationchain/validationchain/playbooks_dto'
import fs from 'fs'
import yaml from 'yaml'
import { ValidateAndReadPlaybook } from '../services/playbook'
import { PlaybookTasksDTO } from '@mamoru-ai/validation-chain-ts-client/src/validationchain.validationchain/types/validationchain/validationchain/playbooks_dto'

export interface PlaybookPublishOptions {
    rpc?: string
    privateKey: string
    gas?: string
    playbookId?: string
}

async function PlaybookPublish(
    program: Command,
    projectPath: string,
    options: PlaybookPublishOptions
) {
    const verbosity = program.opts().verbose
    const logger = new Logger(verbosity)
    logger.verbose('Run playbook publish')
    logger.verbose('options', options)
    logger.verbose('projectPath', projectPath)
    if (!fs.existsSync(projectPath)) {
        program.error(
            'The project path does not exist. Please specify a valid path to your project.'
        )
    }
    logger.verbose(`PublishOptions ${JSON.stringify(options, null, 2)}`)

    const vcService = new ValidationChainService(
        options.rpc,
        options.privateKey,
        logger
    )

    // Read and parse the YAML file
    const yamlData = fs.readFileSync(
        path.join(projectPath, PLAYBOOK_FILES.PLAYBOOK_YAML),
        'utf8'
    )
    const playbookData = yaml.parse(yamlData) as any // Use 'as any' for now
    if (!ValidateAndReadPlaybook(logger, program, playbookData)) {
        logger.error('Playbook validation failed')
        process.exit(1)
    }
    // Convert parsedYaml to JSON
    //const jsonContent = JSON.stringify(playbookData);
    // Convert the YAML data to a PlaybookDTO instance
    const playbook: PlaybookDTO = PlaybookDTO.fromJSON(playbookData)

    logger.verbose(`Playbook: ${JSON.stringify(playbook, null, 2)}`)

    let responsePlaybookId: string
    if (options.playbookId) {
        playbook.id = options.playbookId
        const response = await vcService.updatePlaybook(playbook, options.gas)
        logger.ok('response', response)
        responsePlaybookId = response.playbookId
    } else {
        const response = await vcService.createPlaybook(playbook, options.gas)
        logger.ok('response', response)
        responsePlaybookId = response.playbookId
    }

    logger.ok('Publishing to Validation chain')

    return {
        responsePlaybookId,
    }
}

export default {
    PlaybookPublish,
}
