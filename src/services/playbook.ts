import joi from 'joi'
import { Logger } from './console'
import { Command } from 'commander'
import { formatJoiError } from './utils'
import { Playbook } from '../types'

const playbookSchema = joi.object({
    name: joi.string().required(),
    on: joi.array().items(
        joi.object({
            daemonId: joi.string(),
            levels: joi.array().items(joi.string()).min(1),
        })
    ),
    tasks: joi.object().required(),
})

export const isValidPlaybookManifest = (
    logger: Logger,
    program: Command,
    playbook: any
): boolean => {
    logger.ok(`Validating Playbook content`)

    const { error } = playbookSchema.validate(playbook, { abortEarly: false })

    if (error) {
        const formatted = formatJoiError(error)
        logger.error(formatted)
        program.error(formatted)

        return false
    }

    return true
}

export const getDaemonIdsFromPlaybook = (playbook: Playbook): string[] => {
    const daemonIds: string[] = []

    for (const on of playbook.on) {
        if (on.daemonId) {
            daemonIds.push(on.daemonId)
        }
    }

    return daemonIds
}
