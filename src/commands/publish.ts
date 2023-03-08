import type { Command } from 'commander'
import path from 'path'
import fs from 'fs'
import { Logger } from '../services/console'
import { validateAndReadManifest } from '../services/manifest'
import { OUT_DIR, WASM_INDEX } from '../services/constants'
import queryManifest from '../services/query-manifest'
import ValidationChainService from '../services/validation-chain'
import { prepareBinaryFile } from '../services/assemblyscript'

export interface PublishOptions {
    rpcUrl: string
    key: string
}

async function publish(
    program: Command,
    projectPath: string,
    options: PublishOptions
) {
    const verbosity = program.opts().verbose
    const logger = new Logger(verbosity)

    const buildPath = path.join(projectPath, OUT_DIR)

    logger.ok('Validating Query manifest')
    validateBuildPath(program, buildPath)
    const manifest = validateAndReadManifest(logger, program, buildPath)

    logger.ok('Publishing to Validation chain')
    const vcService = new ValidationChainService(options.rpcUrl, options.key)

    if (manifest.type === 'sql') {
        const queries = queryManifest.getQueries(projectPath)
        await vcService.registerDaemonMetadata(manifest, queries)
    }

    if (manifest.type === 'wasm') {
        const wasm = prepareBinaryFile(path.join(buildPath, WASM_INDEX))
        await vcService.registerDaemonMetadata(manifest, [], wasm)
    }

    logger.ok('Published successfully')
}

function validateBuildPath(program: Command, buildPath: string): void {
    if (!fs.existsSync(buildPath))
        program.error(
            'Project is not compiled, compile it first, use "mamoru-cli build"'
        )
}

export default {
    publish,
}
