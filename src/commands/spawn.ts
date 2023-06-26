import { Command } from 'commander'
import { Logger } from '../services/console'
import ValidationChainService from '../services/validation-chain'
import { DaemonMetadataType } from '@mamoru-ai/validation-chain-ts-client/dist/validationchain.validationchain/types/validationchain/validationchain/daemon_metadata_utils'
export interface SpawnOptions {
    metadataId: string
    rpc?: string
    privateKey: string
    gas?: string
    chain?: string
    parameters?: string
}
import colors from 'colors'
import { MAMORU_EXPLORER_URL } from '../services/constants'
import { MsgRegisterDaemonResponse } from '@mamoru-ai/validation-chain-ts-client/dist/validationchain.validationchain/types/validationchain/validationchain/tx'
import { chain_ChainTypeToJSON } from '@mamoru-ai/validation-chain-ts-client/dist/validationchain.validationchain/types/validationchain/validationchain/chain'
import { validateAndParseParameterFlag } from '../utils/utils'

export default async function spawn(program: Command, options: SpawnOptions) {
    const { metadataId } = options
    const verbosity = program.opts().verbose
    const logger = new Logger(verbosity)
    const parameterValues = validateAndParseParameterFlag(options.parameters)

    const vcService = new ValidationChainService(
        options.rpc,
        options.privateKey,
        logger
    )

    const metadata = await vcService
        .getDaemonMetadataById(metadataId)
        .catch((err) => {
            err.message = `Error retrieving metadata "${metadataId}": ${err.message}`
            throw err
        })
    if (!metadata) {
        throw new Error('Metadata not found')
    }
    if (metadata.type !== DaemonMetadataType.SUBCRIBABLE) {
        throw new Error('Metadata is not subscribable')
    }

    if (metadata.supportedChains.length === 0) {
        throw new Error('Metadata does not support any chain')
    }
    let result: MsgRegisterDaemonResponse
    if (options.chain) {
        result = await vcService.registerDaemon(
            metadataId,
            options.chain,
            parameterValues
        )
    } else if (metadata.supportedChains.length === 1 && !options.chain) {
        logger.ok(
            'Registering daemon for default chain ' +
                metadata.supportedChains[0].chainType
        )
        result = await vcService.registerDaemon(
            metadataId,
            chain_ChainTypeToJSON(metadata.supportedChains[0].chainType),
            parameterValues
        )
    } else if (metadata.supportedChains.length > 1 && !options.chain) {
        throw new Error(
            'Daemon supports multiple chains, please specify one with --chain'
        )
    }

    logger.log(
        `Daemon registered successfully 🎉

    ℹ️  Daemon Hash(ID): 

        ${colors.magenta(result.daemonId)}

    ℹ️  Explorer Url for parent DaemonMetadata:

        ${colors.underline.blue(
            `${MAMORU_EXPLORER_URL}/explorer/daemons/${metadataId}`
        )}`
    )
    return result
}
