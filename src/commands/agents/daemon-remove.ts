import { Command } from 'commander'
import { Logger } from '../../services/console'
import ValidationChainService from '../../services/validation-chain'
import colors from 'colors'
import { MsgUnregisterDaemonResponse } from '@mamoru-ai/validation-chain-ts-client/dist/validationchain.validationchain/types/validationchain/validationchain/tx'

export interface removeDaemonOptions {
    rpc?: string
    privateKey: string
}

export default async function removeDaemon(
    program: Command,
    id: string,
    options: removeDaemonOptions
): Promise<MsgUnregisterDaemonResponse> {
    const { rpc, privateKey } = options

    const verbosity = program.opts().verbose
    const logger = new Logger(verbosity)
    logger.verbose(`LaunchOptions ${JSON.stringify(options, null, 2)}`)

    const vcService = new ValidationChainService(rpc, privateKey, logger)

    const result = await vcService.unRegisterDaemon(id).catch((err) => {
        err.message = `Error removing daemon "${id}": ${err.message}`
        throw err
    })

    logger.log(
        `Daemon removed successfully 🎉

  ℹ️  Daemon Hash(ID): 

      ${colors.magenta(result.daemonId)}`
    )
    return result
}
