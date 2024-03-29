import { Command } from 'commander'
import { Logger } from '../../services/console'
import path from 'path'
import { MAMORU_EXPLORER_URL, PLAYBOOK_FILES } from '../../services/constants'
import ValidationChainService from '../../services/validation-chain'
import { PlaybookDTO } from '@mamoru-ai/validation-chain-ts-client/dist/validationchain.validationchain/types/validationchain/validationchain/playbooks_dto'
import fs from 'fs'
import yaml from 'yaml'
import {
    getDaemonIdsFromPlaybook,
    isValidPlaybookManifest,
} from '../../services/playbook'
import colors from 'colors'
import { getDaemonsByIds } from '../../services/graphql-api/graphql-api.service'

export interface PlaybookPublishOptions {
    rpc?: string
    privateKey: string
    playbookId?: string
    skipTelemetry?: boolean
}

const env = process.env.NODE_ENV

async function playbookPublish(
    program: Command,
    projectPath: string,
    options: PlaybookPublishOptions
) {
    const verbosity = program.opts().verbose
    const logger = new Logger(verbosity)
    logger.verbose('Run playbook publish')
    logger.verbose('options', options)
    logger.verbose('projectPath', projectPath)

    const playbookYamlPath = path.join(
        projectPath,
        PLAYBOOK_FILES.PLAYBOOK_YAML
    )
    if (!fs.existsSync(playbookYamlPath)) {
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
    const yamlData = fs.readFileSync(playbookYamlPath, 'utf8')
    const playbookData = yaml.parse(yamlData) as any // Use 'as any' for now
    if (!isValidPlaybookManifest(logger, playbookData)) {
        logger.error('Playbook validation failed')
        process.exit(1)
    }

    // Convert the YAML data to a PlaybookDTO instance
    const playbook: PlaybookDTO = PlaybookDTO.fromJSON(playbookData)

    logger.verbose(`Playbook: ${JSON.stringify(playbook, null, 2)}`)

    if (env == undefined) {
        const daemonIds = getDaemonIdsFromPlaybook(playbook)
        try {
            const existingDaemons = await getDaemonsByIds(daemonIds)
            logger.verbose('existingDaemons', existingDaemons)
            logger.verbose('playbookDaemonIds', daemonIds)

            if (existingDaemons.length < daemonIds.length) {
                throw new Error(
                    `Some of the Agents specified in the playbook do not exist. Please check the daemon IDs and try again, 
                    
                    Daemons found: ${existingDaemons
                        .map((d) => d.id)
                        .join(', ')}
                    `
                )
            }
        } catch (error) {
            handleError(error)
        }
    }

    let responsePlaybookId = ''
    if (options.playbookId) {
        try {
            const response = await vcService.updatePlaybook(
                options.playbookId,
                playbook
            )
            logger.verbose('response', response)
            responsePlaybookId = response.playbookId
        } catch (error) {
            handleError(error)
        }
    } else {
        try {
            const response = await vcService.createPlaybook(playbook)
            logger.verbose('response', response)
            responsePlaybookId = response.playbookId
        } catch (error) {
            handleError(error)
        }
    }

    logger.ok('Publishing to Validation chain')
    const action = options.playbookId ? 'updated' : 'created'
    logger.log(
        `Playbook ${action} successfully 🎉
        ℹ️  Playbook Hash(ID):
            ${colors.magenta(responsePlaybookId)}
        ℹ️  Explorer Url (it may take a few seconds to become available):
            ${colors.underline.blue(
                `${MAMORU_EXPLORER_URL}/playbooks/${responsePlaybookId}`
            )}`
    )
    return {
        responsePlaybookId,
    }
}

function handleError(error: any) {
    let message = ''
    if (error.errors) {
        for (const err of error.errors) {
            message += err.message + '\n'
        }
    } else {
        message = error
    }

    throw new Error(message)
}

export default {
    playbookPublish,
}
