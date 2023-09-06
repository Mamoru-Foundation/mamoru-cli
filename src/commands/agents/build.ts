/* eslint-disable no-console */
import * as fs from 'fs'
import * as path from 'path'
import type { Command } from 'commander'

import {
    serializeAndSaveManifest,
    validateAndReadManifest,
} from '../../services/manifest'
import { Logger } from '../../services/console'
import { OUT_DIR } from '../../services/constants'
import { Manifest } from '../../types'
import { runCommand } from '../../utils/utils'

async function build(program: Command, projectPath: string) {
    const verbosity = program.opts().verbose
    const logger = new Logger(verbosity)
    logger.verbose('Building project')

    const manifest = validateAndReadManifest(logger, program, projectPath)
    validateIsWasmProject(program, manifest)
    const buildPath = prepareBuildPath(logger, projectPath)
    const inFile = path.join(projectPath, 'src', 'index.ts')
    const outFile = path.join(buildPath, 'index.wasm')

    await buildAssemblyScript(logger, program, inFile, outFile, projectPath)
    // await checkAssemblyScriptBuild(logger, program, outFile)
    serializeAndSaveManifest(logger, manifest, buildPath)
    copyPackageJson(logger, projectPath, buildPath)

    logger.ok('Done!')
}

function prepareBuildPath(logger: Logger, projectPath: string): string {
    const p = path.join(projectPath, OUT_DIR)
    logger.verbose(`Preparing build path ${p}`)
    if (fs.existsSync(p)) {
        fs.rmSync(p, { recursive: true, force: true })
    }
    fs.mkdirSync(p)

    return p
}

function validateIsWasmProject(program: Command, manifest: Manifest): void {
    if (manifest.type !== 'wasm') {
        program.error('Oops, nothing to build for SQL based Agents')
    }
}

async function buildAssemblyScript(
    logger: Logger,
    program: Command,
    inFile: string,
    outFile: string,
    projectPath: string
) {
    logger.ok('Compiling source code')
    if (!fs.existsSync(inFile))
        program.error(`Input File "${inFile}" not found`)

    await runCommand(`npm run build --prefix "${projectPath}"`)

    // const result = await asc
    //     .main([
    //         inFile,
    //         '--exportRuntime',
    //         // Stub runtime, does not implement garbage collection
    //         '--runtime',
    //         'stub',
    //         '--lib',
    //         '--outFile',
    //         outFile,
    //         '--optimize',
    //         '--noAssert',
    //         '--sourceMap',
    //         '--path',
    //         `"${path.join(projectPath, 'node_modules')}"`,
    //     ])
    //     .then((result) => {
    //         logger.verbose('Compilation finished')
    //         return 0
    //     })
    //     .catch((error) => {
    //         logger.verbose('Compilation failed with error')
    //         console.error(error)
    //         program.error('Compilation failed')
    //     })
}

async function checkAssemblyScriptBuild(
    logger: Logger,
    program: Command,
    outFile: string
) {
    const compiledModuleContent = fs.readFileSync(outFile)

    const wasmModule = await WebAssembly.instantiate(compiledModuleContent, {
        crypto: {
            ripemd128: () => {
                console.log('Stub implementation')
            },
            ripemd160: () => {
                console.log('Stub implementation')
            },
            ripemd256: () => {
                console.log('Stub implementation')
            },
            ripemd320: () => {
                console.log('Stub implementation')
            },
            sha2_224: () => {
                console.log('Stub implementation')
            },
            sha2_256: () => {
                console.log('Stub implementation')
            },
            sha2_384: () => {
                console.log('Stub implementation')
            },
            sha2_512: () => {
                console.log('Stub implementation')
            },
            sha_512_224: () => {
                console.log('Stub implementation')
            },
            sha_512_256: () => {
                console.log('Stub implementation')
            },
            sha3_224: () => {
                console.log('Stub implementation')
            },
            sha3_256: () => {
                console.log('Stub implementation')
            },
            sha3_384: () => {
                console.log('Stub implementation')
            },
            sha3_512: () => {
                console.log('Stub implementation')
            },
        },
        format: {
            json_parse: () => {
                console.log('Stub implementation')
            },
            json_stringify: () => {
                console.log('Stub implementation')
            },
            yaml_parse: () => {
                console.log('Stub implementation')
            },
            yaml_stringify: () => {
                console.log('Stub implementation')
            },
            hex_encode: () => {
                console.log('Stub implementation')
            },
            hex_decode: () => {
                console.log('Stub implementation')
            },
            base58_encode: () => {
                console.log('Stub implementation')
            },
            base58_decoding: () => {
                console.log('Stub implementation')
            },
            base64_encode: () => {
                console.log('Stub implementation')
            },
            base64_decode: () => {
                console.log('Stub implementation')
            },
            rlp_encode: () => {
                console.log('Stub implementation')
            },
            rlp_decode: () => {
                console.log('Stub implementation')
            },
        },
        log: {
            log: () => {
                console.log('Stub implementation')
            },
        },
        store: {
            save: () => {
                console.log('Stub implementation')
            },
            load: () => {
                console.log('Stub implementation')
            },
            load_reference: () => {
                console.log('Stub implementation')
            },
            get_next_id: () => {
                console.log('Stub implementation')
            },
        },
        env: {
            abort: () => {
                console.log('Stub implementation')
            },
        },
    })

    if (!wasmModule.instance.exports['main']) {
        program.error(`Method 'main' is not found in module`)
    }
}

export default {
    build,
}
function copyPackageJson(
    logger: Logger,
    projectPath: string,
    buildPath: string
) {
    logger.verbose('Copying package.json')
    const packageJson = path.join(projectPath, 'package.json')
    const packageJsonBuild = path.join(buildPath, 'package.json')
    fs.copyFileSync(packageJson, packageJsonBuild)
}
