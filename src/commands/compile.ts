import * as fs from 'fs'
import * as path from 'path'
import { Writable } from 'node:stream'
import colors from 'colors'
import type { Command } from 'commander'
import * as asc from 'assemblyscript/cli/asc'

import manifestService from '../services/mainfest'
import { Manifest, ManifestJob } from '../types'

async function compile(program: Command, projectPath: string) {
    const verbosity = program.opts().verbose

    console.log(colors.green('Validating Queryable manifest'))

    const manifest = (
        await manifestService.readAndValidateManifest(
            program,
            null,
            projectPath,
            verbosity,
            false
        )
    ).manifest

    const buildPath = path.join(projectPath, '.queryable')

    if (fs.existsSync(buildPath)) {
        fs.rmSync(buildPath, { recursive: true, force: true })
    }

    fs.mkdirSync(buildPath, { recursive: true })

    console.log(colors.green('Compiling modules'))

    const compiledJobs: Array<ManifestJob> = []

    for (const job of manifest.jobs) {
        if (verbosity > 0) {
            console.log(colors.grey('Compiling module'), job.module)
        }

        const inFile = path.join(projectPath, job.module)
        const outFile = path.join(buildPath, `${job.module}.wasm`)

        try {
            await new Promise((resolve, reject) => {
                const stdout = new Writable()
                const stderr = new Writable()

                asc.main(
                    [
                        inFile,
                        '--exportRuntime',
                        '--runtime',
                        'stub',
                        '--lib',
                        '--outFile',
                        outFile,
                        '--optimize',
                        '--debug',
                        '--sourceMap',
                    ],
                    {
                        stdout,
                        stderr,
                    },
                    (error: Error) => {
                        if (error) {
                            reject({
                                stdout,
                                stderr,
                                error,
                            })

                            return 1
                        }

                        resolve({
                            stdout,
                            stderr,
                            error: null,
                        })

                        return 0
                    }
                )
            })
        } catch (error) {
            console.error(error)
            program.error('Compilation failed')

            return
        }

        const abis = []

        if (job.abis.length > 0) {
            console.log(colors.green('Reading ABIs'))

            for (const abiFileName of job.abis) {
                if (verbosity > 0) {
                    console.log(colors.grey('Reading ABI'), job.module)
                }

                const abiPath = path.join(projectPath, abiFileName)

                const abiContent = fs.readFileSync(abiPath)

                abis.push(abiContent.toString('base64'))
            }
        }

        const compiledModuleContent = fs.readFileSync(outFile)

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const wasmModule = await WebAssembly.instantiate(
            compiledModuleContent,
            {
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
                ipfs: {
                    cat: () => {
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
            }
        )

        for (const handle of job.handlers) {
            if (!wasmModule.instance.exports[handle.method]) {
                program.error(
                    `Method '${handle.method}' is not found in module`
                )
            }
        }

        compiledJobs.push({
            name: job.name,
            timeWindow: job.timeWindow,
            module: compiledModuleContent.toString('base64'),
            abis,
            handlers: job.handlers,
            isTemplate: job.isTemplate || false,
        })
    }

    const compiledManifest: Manifest = {
        version: manifest.version,
        name: manifest.name,
        logoUrl: manifest.logoUrl,
        description: manifest.description,
        dataSources: manifest.dataSources,
        entities: manifest.entities,
        jobs: compiledJobs,
    }

    const compiledProjectPath = path.join(buildPath, 'queryable.yaml')

    manifestService.serializeAndSave(
        compiledManifest,
        compiledProjectPath,
        verbosity
    )

    console.log(colors.green('Done!'))
}

export default {
    compile,
}
