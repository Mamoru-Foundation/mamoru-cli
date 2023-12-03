import { Command } from 'commander'
import { Logger } from '../../services/console'
import ValidationChainService from '../../services/validation-chain'
import { DaemonMetadataType } from '@mamoru-ai/validation-chain-ts-client/dist/validationchain.validationchain/types/validationchain/validationchain/daemon_metadata_utils'
import { select } from '@inquirer/prompts'

export interface LaunchOptions {
    metadataId: string
    rpc?: string
    privateKey: string
    gas?: string
    chain?: string
    parameters?: string
}
import colors from 'colors'
import { MAMORU_EXPLORER_URL } from '../../services/constants'
import {
    queryDaemonParameters,
    validateAndParseParameterFlag,
} from '../../utils/utils'
import { DaemonMetadata } from '@mamoru-ai/validation-chain-ts-client/src/validationchain.validationchain/types/validationchain/validationchain/daemon_metadata'
import { assignOrganizationToDaemonRepeat } from '../../services/graphql-api/graphql-api.service'

const env = process.env.NODE_ENV

export default async function launch(program: Command, options: LaunchOptions) {
    const { metadataId: metadataId } = options
    const verbosity = program.opts().verbose
    const logger = new Logger(verbosity)
    logger.verbose(`LaunchOptions ${JSON.stringify(options, null, 2)}`)

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

    const finalParameterValues = await queryDaemonParameters(
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
        finalParameterValues,
        options.gas
    )

    logger.log(`Waiting for daemon to be assigned to organization...`)
    if (env == undefined) {
        const gqlres = await assignOrganizationToDaemonRepeat(
            result.daemonId,
            logger
        )
        logger.verbose(
            `assignOrganizationToDaemon response: ${JSON.stringify(
                gqlres,
                null,
                2
            )}`
        )
    }

    logger.log(
        `Daemon registered successfully 🎉

    ℹ️  Daemon Hash(ID): 

        ${colors.magenta(result.daemonId)}

    ℹ️  Explorer Url for parent DaemonMetadata:

        ${colors.underline.blue(`${MAMORU_EXPLORER_URL}/agents/${metadataId}`)}`
    )
    return result
}

async function queryChain(
    metadata: DaemonMetadata,
    options: LaunchOptions
): Promise<string> {
    if (options.chain) return options.chain
    if (metadata.supportedChains.length === 1)
        return metadata.supportedChains[0].name

    const chain = await select({
        message: 'To what chain do you want to register the daemon?',
        choices: metadata.supportedChains.map((chain) => ({
            value: chain.name,
        })),
    })

    return chain as string
}
