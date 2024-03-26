/* eslint-disable no-console */
import assert from 'node:assert'
import { describe, it } from '@jest/globals'
import init, { AugmentedInitOptions, InitOptions } from './init'
import path from 'node:path'
import fs from 'node:fs'
import colors from 'colors'
import yaml from 'yaml'
import { getProgramMock, getTempFolder } from '../../utils/test-utils'
import { sdkVersions } from '../../sdk-dependency-versions'
import { DEFAULT_MAMORU_VERSION } from '../../services/constants'

const programMock = getProgramMock()

describe(colors.yellow('init'), () => {
    const sqlCases = [
        [
            'SUI_MAINNET',
            "SELECT 1 FROM transactions t WHERE starts_with(t.digest, '0x1_this_is_an_example_query')",
        ],
        [
            'SUI_TESTNET',
            "SELECT 1 FROM transactions t WHERE starts_with(t.digest, '0x1_this_is_an_example_query')",
        ],
        [
            'BSC_TESTNET',
            "SELECT 1 FROM transactions t WHERE starts_with(t.tx_hash, '0x1_this_is_an_example_query')",
        ],
        [
            'BSC_MAINNET',
            "SELECT 1 FROM transactions t WHERE starts_with(t.tx_hash, '0x1_this_is_an_example_query')",
        ],
        [
            'ETH_TESTNET',
            "SELECT 1 FROM transactions t WHERE starts_with(t.tx_hash, '0x1_this_is_an_example_query')",
        ],
        [
            'ETH_MAINNET',
            "SELECT 1 FROM transactions t WHERE starts_with(t.tx_hash, '0x1_this_is_an_example_query')",
        ],
        [
            'APTOS_TESTNET',
            "SELECT 1 FROM transactions t WHERE starts_with(t.hash, '0x1_this_is_an_example_query')",
        ],
        [
            'APTOS_MAINNET',
            "SELECT 1 FROM transactions t WHERE starts_with(t.hash, '0x1_this_is_an_example_query')",
        ],
        ['UNRECOGNIZED', 'SELECT 1 FROM transactions'],
        ['SUI_DEVNET', 'SELECT 1 FROM transactions'],
    ]
    it.each(sqlCases)(
        'OK - Should create Files - type=sql, %s',
        async (chain, query) => {
            const dir = getTempFolder()
            const options: InitOptions = {
                type: 'sql',
                name: 'TEST name',
                tags: 'test,cli',
                description: 'TEST_DESCRIPTION',
                chain: [chain],
                logo: 'https://test.com/logo.png',
                subscribable: false,
                skipTelemetry: true,
            }

            await init.init(programMock, dir, options)

            const files = fs.readdirSync(dir)
            assert.strictEqual(files.length, 5)
            assert.strictEqual(files.includes('readme.md'), true)
            assert.strictEqual(files.includes('package.json'), true)
            assert.strictEqual(files.includes('manifest.yml'), true)
            assert.strictEqual(files.includes('queries.yml'), true)

            const packageJson = fs.readFileSync(
                path.join(dir, 'package.json'),
                'utf-8'
            )
            const packageParsed = JSON.parse(packageJson)

            assert.deepEqual(packageParsed, {
                dependencies: {
                    '@mamoru-ai/mamoru-sdk-as': '^0.7.0',
                    ...packageParsed.dependencies,
                },
                description: 'TEST_DESCRIPTION',
                devDependencies: {
                    assemblyscript: '^0.27.1',
                    '@as-pect/cli': '^8.1.0',
                },
                license: 'Apache-2.0',
                name: 'test-name',
                scripts: {
                    build: 'asc src/index.ts --exportRuntime --outFile build/index.wasm -b build/index.wat --sourceMap --optimize --exportRuntime --runtime stub --lib',
                    test: 'asp --verbose',
                    'test:ci': 'asp --summary',
                },
                tags: ['test', 'cli'],
                version: '0.0.1',
                type: 'module',
            })

            const manifest = fs.readFileSync(
                path.join(dir, 'manifest.yml'),
                'utf-8'
            )
            const manifestParsed = yaml.parse(manifest)
            assert.deepEqual(manifestParsed, {
                chains: [chain],
                description: 'TEST_DESCRIPTION',
                logoUrl: 'https://test.com/logo.png',
                name: 'test-name',
                tags: ['test', 'cli'],
                version: '0.0.1',
                type: 'sql',
                subscribable: false,
            })

            const queries = fs.readFileSync(
                path.join(dir, 'queries.yml'),
                'utf-8'
            )
            const queriesParsed = yaml.parse(queries)
            assert.deepEqual(queriesParsed, {
                version: DEFAULT_MAMORU_VERSION,
                queries: [
                    {
                        query: query,

                        incidentMessage:
                            'This is an example Agent Incident Message',
                        severity: 'SEVERITY_ERROR',
                    },
                ],
            })
        }
    )

    const wasmCases = [
        [
            'SUI_MAINNET',
            '@mamoru-ai/mamoru-sui-sdk-as',
            sdkVersions.sui,
            'import { SuiCtx } from "@mamoru-ai/mamoru-sui-sdk-as/assembly"',
        ],
        [
            'SUI_TESTNET',
            '@mamoru-ai/mamoru-sui-sdk-as',
            sdkVersions.sui,
            'import { SuiCtx } from "@mamoru-ai/mamoru-sui-sdk-as/assembly"',
        ],
        [
            'BSC_TESTNET',
            '@mamoru-ai/mamoru-evm-sdk-as',
            sdkVersions.evm,
            'import { EvmCtx } from "@mamoru-ai/mamoru-evm-sdk-as/assembly"',
        ],
        [
            'BSC_MAINNET',
            '@mamoru-ai/mamoru-evm-sdk-as',
            sdkVersions.evm,
            'import { EvmCtx } from "@mamoru-ai/mamoru-evm-sdk-as/assembly"',
        ],
        [
            'ETH_TESTNET',
            '@mamoru-ai/mamoru-evm-sdk-as',
            sdkVersions.evm,
            'import { EvmCtx } from "@mamoru-ai/mamoru-evm-sdk-as/assembly"',
        ],
        [
            'APTOS_TESTNET',
            '@mamoru-ai/mamoru-aptos-sdk-as',
            sdkVersions.aptos,
            'import { AptosCtx } from "@mamoru-ai/mamoru-aptos-sdk-as/assembly"',
        ],
        [
            'APTOS_MAINNET',
            '@mamoru-ai/mamoru-aptos-sdk-as',
            sdkVersions.aptos,
            'import { AptosCtx } from "@mamoru-ai/mamoru-aptos-sdk-as/assembly"',
        ],
    ]
    it.each(wasmCases)(
        'OK - Should create Files - type=wasm, %s',
        async (chain, customSdk, version, importName) => {
            const dir = getTempFolder()
            const options: InitOptions = {
                type: 'wasm',
                name: 'TEST name',
                tags: 'test,cli',
                description: 'TEST_DESCRIPTION',
                chain: [chain],
                logo: 'https://test.com/logo.png',
                subscribable: false,
                skipTelemetry: true,
            }

            await init.init(programMock, dir, options)

            const files = fs.readdirSync(dir)
            assert.strictEqual(files.length, 8)

            assert.strictEqual(files.includes('readme.md'), true)
            assert.strictEqual(files.includes('package.json'), true)
            assert.strictEqual(files.includes('manifest.yml'), true)
            assert.strictEqual(files.includes('.gitignore'), true)
            assert.strictEqual(files.includes('src'), true)

            const srcFiles = fs.readdirSync(path.join(dir, 'src'))
            assert.strictEqual(srcFiles.length, 4)
            assert.strictEqual(srcFiles.includes('index.ts'), true)
            assert.strictEqual(srcFiles.includes('__tests__'), true)
            assert.strictEqual(srcFiles.includes('process.ts'), true)
            assert.strictEqual(srcFiles.includes('tsconfig.json'), true)

            const testFiles = fs.readdirSync(path.join(dir, 'src/__tests__'))
            assert.strictEqual(testFiles.length, 2)
            assert.strictEqual(testFiles.includes('process.spec.ts'), true)
            assert.strictEqual(testFiles.includes('as-pect.d.ts'), true)
            const packageJson = fs.readFileSync(
                path.join(dir, 'package.json'),
                'utf-8'
            )

            const parsedPackage = JSON.parse(packageJson)

            assert.deepEqual(parsedPackage, {
                dependencies: {
                    '@mamoru-ai/mamoru-sdk-as': '^0.7.0',
                    [customSdk]: version,
                },
                description: 'TEST_DESCRIPTION',
                devDependencies: {
                    assemblyscript: '^0.27.1',
                    '@as-pect/cli': '^8.1.0',
                },
                license: 'Apache-2.0',
                name: 'test-name',
                scripts: {
                    build: 'asc src/index.ts --exportRuntime --outFile build/index.wasm -b build/index.wat --sourceMap --optimize --exportRuntime --runtime stub --lib',
                    test: 'asp --verbose',
                    'test:ci': 'asp --summary',
                },
                tags: ['test', 'cli'],
                version: '0.0.1',
                type: 'module',
            })

            const manifest = fs.readFileSync(
                path.join(dir, 'manifest.yml'),
                'utf-8'
            )
            const manifestParsed = yaml.parse(manifest)
            assert.deepEqual(manifestParsed, {
                chains: [chain],
                description: 'TEST_DESCRIPTION',
                logoUrl: 'https://test.com/logo.png',
                name: 'test-name',
                tags: ['test', 'cli'],
                version: '0.0.1',
                type: 'wasm',
                subscribable: false,
            })
            const index = fs.readFileSync(
                path.join(dir, 'src', 'index.ts'),
                'utf-8'
            )

            assert.match(index, new RegExp(importName))
        },
        1000
    )
    it('FAIL - Fail if project is already in folder', async () => {
        const dir = getTempFolder()

        const options: InitOptions = {
            type: 'sql',
            name: 'TEST name',
            tags: 'test,cli',
            description: 'TEST_DESCRIPTION',
            chain: ['SUI_TESTNET'],
            logo: 'https://test.com/logo.png',
            subscribable: false,
            skipTelemetry: true,
        }
        await init.init(programMock, dir, options)

        try {
            await init.init(programMock, dir, options)
            throw new Error('Test should fail')
        } catch (error) {
            // pass
        }
    })
})
describe('getAugmentedInitOptions', () => {
    it('Should return augmented options', async () => {
        const options: InitOptions = {
            type: 'sql',
            name: 'TEST name',
            tags: 'test,cli',
            description: 'TEST_DESCRIPTION',
            chain: ['SUI_TESTNET'],
            logo: 'https://test.com/logo.png',
            subscribable: false,
            skipTelemetry: true,
        }
        const augmented = await init.getAugmentedInitOptions(options, '.')
        assert.deepEqual(augmented, {
            ...augmented,
            type: 'sql',
            name: 'TEST name',
            tags: 'test,cli',
            description: 'TEST_DESCRIPTION',
            chain: ['SUI_TESTNET'],
            logo: 'https://test.com/logo.png',
            subscribable: false,
            defaultQuery:
                "SELECT 1 FROM transactions t WHERE starts_with(t.digest, '0x1_this_is_an_example_query')",
            jsonTags: '["test","cli"]',
            kebabName: 'test-name',
            mamoruCoreVersion: DEFAULT_MAMORU_VERSION,
        } as AugmentedInitOptions)
    })
    it('default name', async () => {
        const options: InitOptions = {
            type: 'sql',
            name: '',
            tags: 'test,cli',
            description: 'TEST_DESCRIPTION',
            chain: ['SUI_TESTNET'],
            logo: 'https://test.com/logo.png',
            subscribable: false,
            skipTelemetry: true,
        }
        const augmented = await init.getAugmentedInitOptions(options, '.')
        assert.deepEqual(augmented, {
            ...augmented,
            type: 'sql',
            name: 'Default name',
            tags: 'test,cli',
            description: 'TEST_DESCRIPTION',
            chain: ['SUI_TESTNET'],
            logo: 'https://test.com/logo.png',
            subscribable: false,
            defaultQuery:
                "SELECT 1 FROM transactions t WHERE starts_with(t.digest, '0x1_this_is_an_example_query')",
            jsonTags: '["test","cli"]',
            kebabName: 'default-name',
            mamoruCoreVersion: DEFAULT_MAMORU_VERSION,
        })
    })

    it('default name project-path (another/daemon_new)', async () => {
        const options: InitOptions = {
            type: 'sql',
            name: '',
            tags: 'test,cli',
            description: 'TEST_DESCRIPTION',
            chain: ['SUI_TESTNET'],
            logo: 'https://test.com/logo.png',
            subscribable: false,
        }
        const augmented = await init.getAugmentedInitOptions(
            options,
            'another/daemon_new'
        )

        const expected: AugmentedInitOptions = {
            ...augmented,
            type: 'sql',
            name: 'daemon_new',
            tags: 'test,cli',
            description: 'TEST_DESCRIPTION',
            chain: ['SUI_TESTNET'],
            logo: 'https://test.com/logo.png',
            subscribable: false,
            defaultQuery:
                "SELECT 1 FROM transactions t WHERE starts_with(t.digest, '0x1_this_is_an_example_query')",
            jsonTags: '["test","cli"]',
            kebabName: 'daemon_new',
            mamoruCoreVersion: DEFAULT_MAMORU_VERSION,
        }
        assert.deepEqual(augmented, expected)
    })
})
