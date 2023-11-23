import type { Command } from 'commander'
import path from 'path'
import fs from 'fs'
import { Logger } from '../../services/console'
import { validateAndReadManifest } from '../../services/manifest'
import {
    MAMORU_EXPLORER_URL,
    MAMORU_VERSION_KEY,
    OUT_DIR,
    WASM_INDEX,
} from '../../services/constants'
import queryManifest from '../../services/query-manifest'
import ValidationChainService from '../../services/validation-chain'
import { prepareBinaryFile } from '../../services/assemblyscript'
import { Manifest } from '../../types'
import colors from 'colors'
import {
    getSdkVersions,
    queryDaemonParameters,
    validateAndParseParameterFlag,
} from '../../utils/utils'
import { assignOrganizationToDaemonRepeat } from '../../services/graphql-api/graphql-api.service'

export interface PublishOptions {
    rpc?: string
    privateKey: string
    gas?: string
    parameters?: string
    chain?: string
    skipTelemetry?: boolean
}

const env = process.env.NODE_ENV

async function publish(
    program: Command,
    projectPath: string,
    options: PublishOptions
) {
    const verbosity = program.opts().verbose
    const logger = new Logger(verbosity)
    logger.verbose(`PublishOptions ${JSON.stringify(options, null, 2)}`)
    const buildPath = path.join(projectPath, OUT_DIR)
    const parameterValues = validateAndParseParameterFlag(options.parameters)
    logger.ok('Validating Query manifest')

    const manifest = validateAndReadManifest(logger, program, projectPath)
    logger.verbose(`manifest: ${JSON.stringify(manifest, null, 2)}`)
    validateBuildPath(program, buildPath, manifest)

    logger.ok('Publishing to Validation chain')

    if (
        manifest.chains.length > 1 &&
        !options.chain &&
        !manifest.subscribable
    ) {
        throw new Error(
            `This Agent Metadata supports multiple chains, please specify a chain with the --chain flag`
        )
    }
    if (options.chain && !manifest.chains.includes(options.chain)) {
        throw new Error(
            `This Agent Metadata does not support the chain ${options.chain}`
        )
    }

    const vcService = new ValidationChainService(
        options.rpc,
        options.privateKey,
        logger
    )

    let daemonMetadataId = ''

    if (manifest.type === 'sql') {
        const queryManifestFile = queryManifest.get(logger, projectPath)
        const result = await vcService.registerDaemonMetadata(
            manifest,
            queryManifestFile.queries,
            null,
            null,
            [
                {
                    sdk: MAMORU_VERSION_KEY,
                    version: queryManifestFile.version || '0.0.0',
                },
            ]
        )
        daemonMetadataId = result.daemonMetadataId
    }

    if (manifest.type === 'wasm') {
        const wasm = prepareBinaryFile(path.join(buildPath, WASM_INDEX))
        const sdkVersions = getSdkVersions(logger, buildPath)
        const r = await vcService.registerDaemonMetadata(
            manifest,
            [],
            wasm,
            options.gas,
            sdkVersions
        )
        daemonMetadataId = r.daemonMetadataId
    }

    logger.verbose(`daemonMetadataId: ${daemonMetadataId}`)

    if (!manifest.subscribable) {
        logger.ok('Registering Daemon to Validation chain')
        const metadata = await vcService.getDaemonMetadataById(daemonMetadataId)
        const finalParameterValues = await queryDaemonParameters(
            metadata,
            options,
            options.chain || manifest.chains[0]
        )

        logger.verbose(
            `parameters: ${JSON.stringify(finalParameterValues, null, 2)}`
        )

        const r = await vcService.registerDaemonFromManifest(
            manifest,
            daemonMetadataId,
            options.chain || manifest.chains[0],
            finalParameterValues,
            options.gas
        )

        //if (env == undefined) {
        logger.log(`Waiting for daemon to be assigned to organization...`)
        const gqlres = await assignOrganizationToDaemonRepeat(
            r.daemonId,
            logger
        )
        logger.verbose(
            `assignOrganizationToDaemon response: ${JSON.stringify(
                gqlres,
                null,
                2
            )}`
        )
        //  }

        logger.log(
            `Agent registered successfully 🎉
        ℹ️  Metadata Hash(ID):
            ${colors.magenta(daemonMetadataId)}
        ℹ️  Agent Hash(ID):
            ${colors.magenta(r.daemonId)}
        ℹ️  Explorer Url (it may take a few seconds to become available):
            ${colors.underline.blue(
                `${MAMORU_EXPLORER_URL}/agents/${r.daemonId}`
            )}
        `
        )
        return {
            daemonMetadataId,
            daemonId: r.daemonId,
        }
    } else {
        logger.log(
            `Agent Metadata registered successfully 🎉

    ℹ️  Agent Metadata (template) Hash(ID): 

        ${colors.magenta(daemonMetadataId)}
        `
        )
    }
    logger.ok('Published successfully')

    return {
        daemonMetadataId,
    }
}

function validateBuildPath(
    program: Command,
    buildPath: string,
    manifest: Manifest
): void {
    if (manifest.type === 'sql') return
    if (!fs.existsSync(buildPath))
        program.error(
            'Project is not compiled, compile it first, use "mamoru-cli build"'
        )
}

export default {
    publish,
}
