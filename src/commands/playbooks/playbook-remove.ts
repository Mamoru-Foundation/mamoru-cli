import { Command } from 'commander'
import { Logger } from '../../services/console'
import ValidationChainService from '../../services/validation-chain'
import { PlaybookPublishOptions } from './playbook-publish'

export const removePlaybook = async (
    program: Command,
    id: string,
    options: PlaybookPublishOptions
) => {
    const verbosity = program.opts().verbose
    const logger = new Logger(verbosity)
    logger.verbose('Run playbook remove')
    logger.verbose('options', options)
    logger.verbose('id', id)

    const vcService = new ValidationChainService(
        options.rpc,
        options.privateKey,
        logger
    )

    const res = await vcService.removePlaybook(id)

    logger.verbose(`Remove playbook response: ${JSON.stringify(res, null, 2)}`)
    logger.log(`Playbook removed successfully`)
}
