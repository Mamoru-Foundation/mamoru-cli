import type { Command } from 'commander'
import path from 'path'
import fs from 'fs'
import { Logger } from '../services/console'
import { validateAndReadManifest } from '../services/manifest'
import { MAMORU_EXPLORER_URL, OUT_DIR, WASM_INDEX } from '../services/constants'
import queryManifest from '../services/query-manifest'
import ValidationChainService from '../services/validation-chain'
import { prepareBinaryFile } from '../services/assemblyscript'
import { Manifest } from '../types'
import colors from 'colors'
import { validateAndParseParameterFlag } from '../utils/utils'

export interface PublishOptions {
    rpc?: string
    privateKey: string
    gas?: string
    parameters?: string
}

async function publish(
    program: Command,
    projectPath: string,
    options: PublishOptions
) {
    const verbosity = program.opts().verbose
    const logger = new Logger(verbosity)
    const buildPath = path.join(projectPath, OUT_DIR)
    const parameterValues = validateAndParseParameterFlag(options.parameters)
    logger.ok('Validating Query manifest')

    const manifest = validateAndReadManifest(logger, program, projectPath)
    validateBuildPath(program, buildPath, manifest)

    logger.ok('Publishing to Validation chain')
    const vcService = new ValidationChainService(
        options.rpc,
        options.privateKey,
        logger
    )

    let daemonMetadataId = ''

    if (manifest.type === 'sql') {
        const queries = queryManifest.getQueries(logger, projectPath)
        const r = await vcService.registerDaemonMetadata(manifest, queries)
        daemonMetadataId = r.daemonMetadataId
    }

    if (manifest.type === 'wasm') {
        const wasm = prepareBinaryFile(path.join(buildPath, WASM_INDEX))
        const r = await vcService.registerDaemonMetadata(
            manifest,
            [],
            wasm,
            options.gas
        )
        daemonMetadataId = r.daemonMetadataId
    }

    if (!manifest.subscribable) {
        logger.ok('Registering Daemon to Validation chain')
        const r = await vcService.registerDaemonFromManifest(
            manifest,
            daemonMetadataId,
            manifest.chains[0],
            parameterValues
        )
        logger.log(
            `Daemon registered successfully 🎉
        ℹ️  Metadata Hash(ID):
            ${colors.magenta(daemonMetadataId)}
        ℹ️  Daemon Hash(ID):
            ${colors.magenta(r.daemonId)}
        ℹ️  Explorer Url (it may take a few seconds to become available):
            ${colors.underline.blue(
                `${MAMORU_EXPLORER_URL}/explorer/daemons/${daemonMetadataId}`
            )}`
        )
        return {
            daemonMetadataId,
            daemonId: r.daemonId,
        }
    } else {
        logger.log(
            `DaemonMetadata registered successfully 🎉

    ℹ️  DaemonMetadata (template) Hash(ID): 

        ${colors.magenta(daemonMetadataId)}

    ℹ️  Explorer Url (it may take a few seconds to become available):

        ${colors.underline.blue(
            `${MAMORU_EXPLORER_URL}/explorer/daemons/${daemonMetadataId}`
        )}`
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
