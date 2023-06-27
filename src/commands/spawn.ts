import { Command } from 'commander'
import { Logger } from '../services/console'
import ValidationChainService from '../services/validation-chain'
import { DaemonMetadataType } from '@mamoru-ai/validation-chain-ts-client/dist/validationchain.validationchain/types/validationchain/validationchain/daemon_metadata_utils'
import { select, input } from '@inquirer/prompts'

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
import {
    chain_ChainTypeFromJSON,
    chain_ChainTypeToJSON,
} from '@mamoru-ai/validation-chain-ts-client/dist/validationchain.validationchain/types/validationchain/validationchain/chain'
import { validateAndParseParameterFlag } from '../utils/utils'
import { DaemonMetadata } from '@mamoru-ai/validation-chain-ts-client/src/validationchain.validationchain/types/validationchain/validationchain/daemon_metadata'

export default async function spawn(program: Command, options: SpawnOptions) {
    const { metadataId } = options
    const verbosity = program.opts().verbose
    const logger = new Logger(verbosity)
    validateAndParseParameterFlag(options.parameters)

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

    const finalChain = await queryChain(metadata, options)

    logger.verbose(`Chain selected: ${finalChain}`)

    const finalParameterValues = await queryParameters(
        metadata,
        options,
        finalChain
    )

    logger.verbose(
        `Registering daemon with parameters: ${JSON.stringify(
            finalParameterValues,
            null,
            2
        )}`
    )

    const result = await vcService.registerDaemon(
        metadataId,
        finalChain,
        finalParameterValues
    )

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

async function queryChain(
    metadata: DaemonMetadata,
    options: SpawnOptions
): Promise<string> {
    if (options.chain) return options.chain
    if (metadata.supportedChains.length === 1)
        return chain_ChainTypeToJSON(metadata.supportedChains[0].chainType)

    const chain = await select({
        message: 'To what chain do you want to register the daemon?',
        choices: metadata.supportedChains.map((chain) => ({
            value: chain_ChainTypeToJSON(chain.chainType),
        })),
    })

    return chain as string
}

async function queryParameters(
    metadata: DaemonMetadata,
    options: SpawnOptions,
    chain: string
): Promise<Record<string, any>> {
    if (options.parameters)
        return validateAndParseParameterFlag(options.parameters)

    const chainType = chain_ChainTypeFromJSON(chain)
    const parameters = metadata.parameters.filter((el) => {
        if (el.hiddenFor.map((el) => el.chainType).includes(chainType))
            return false
        return true
    })

    const result: Record<string, string> = {}
    for (const parameter of parameters) {
        const answer = await input({
            message: `Enter value for parameter "${parameter.key}"`,
            default: parameter.defaultValue,
        })
        result[parameter.key] = answer
    }

    return result
}
