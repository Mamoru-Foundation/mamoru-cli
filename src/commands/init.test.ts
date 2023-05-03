/* eslint-disable no-console */
import assert from 'node:assert'
import { describe, it } from '@jest/globals'
import init, { InitOptions } from './init'
import path from 'node:path'
import fs from 'node:fs'
import colors from 'colors'
import yaml from 'yaml'
import { getProgramMock, getTempFolder } from '../utils/test-utils'
import { Chain_ChainType } from '@mamoru-ai/validation-chain-ts-client/dist/validationchain.validationchain/types/validationchain/validationchain/chain'

const programMock = getProgramMock()

describe(colors.yellow('init'), () => {
    const cases = [
        [
            'SUI_DEVNET' as keyof Chain_ChainType,
            "SELECT 1 FROM transactions t WHERE starts_with(t.digest, '0x1_this_is_an_example_query')",
        ],
        [
            'SUI_TESTNET' as keyof Chain_ChainType,
            "SELECT 1 FROM transactions t WHERE starts_with(t.digest, '0x1_this_is_an_example_query')",
        ],
        [
            'BSC_TESTNET' as keyof Chain_ChainType,
            "SELECT 1 FROM transactions t WHERE starts_with(t.tx_hash, '0x1_this_is_an_example_query')",
        ],
        [
            'BSC_MAINNET' as keyof Chain_ChainType,
            "SELECT 1 FROM transactions t WHERE starts_with(t.tx_hash, '0x1_this_is_an_example_query')",
        ],
        [
            'ETH_TESTNET' as keyof Chain_ChainType,
            "SELECT 1 FROM transactions t WHERE starts_with(t.tx_hash, '0x1_this_is_an_example_query')",
        ],
        [
            'ETH_MAINNET' as keyof Chain_ChainType,
            "SELECT 1 FROM transactions t WHERE starts_with(t.tx_hash, '0x1_this_is_an_example_query')",
        ],
        [
            'APTOS_TESTNET' as keyof Chain_ChainType,
            "SELECT 1 FROM transactions t WHERE starts_with(t.hash, '0x1_this_is_an_example_query')",
        ],
        [
            'APTOS_MAINNET' as keyof Chain_ChainType,
            "SELECT 1 FROM transactions t WHERE starts_with(t.hash, '0x1_this_is_an_example_query')",
        ],
        ['UNRECOGNIZED' as keyof Chain_ChainType, 'SELECT 1 FROM transactions'],
    ]
    it.each(cases)(
        'OK - Should create Files - type=sql, %s',
        (chain, query) => {
            const dir = getTempFolder()
            console.log(colors.green('Temp Folder: ' + dir))
            const options: InitOptions = {
                type: 'sql',
                name: 'TEST name',
                tags: 'test,cli',
                description: 'TEST_DESCRIPTION',
                chain: chain,
                logo: 'https://test.com/logo.png',
                subscribable: false,
            }

            init.init(programMock, dir, options)

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
                dependencies: { '@mamoru-ai/mamoru-sdk-as': '^0.2.1' },
                description: 'TEST_DESCRIPTION',
                devDependencies: { assemblyscript: '^0.27.1' },
                license: 'Apache-2.0',
                name: 'test-name',
                scripts: {
                    build: 'asc src/index.ts --exportRuntime --outFile build/index.wasm -b build/index.wat --sourceMap --optimize --exportRuntime --runtime stub --lib',
                },
                tags: ['test', 'cli'],
                version: '0.0.1',
            })

            const manifest = fs.readFileSync(
                path.join(dir, 'manifest.yml'),
                'utf-8'
            )
            const manifestParsed = yaml.parse(manifest)
            assert.deepEqual(manifestParsed, {
                chain: chain,
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
                queries: [
                    {
                        query: query,

                        incidentMessage:
                            'This is an example Daemon Incident Message',
                        severity: 'WARNING',
                    },
                ],
            })
        }
    )
    it('OK - Should create Files - type=wasm', async () => {
        const dir = getTempFolder()
        // console.log(colors.green('Temp Folder: ' + dir))
        const options: InitOptions = {
            type: 'wasm',
            name: 'TEST name',
            tags: 'test,cli',
            description: 'TEST_DESCRIPTION',
            chain: 'sui',
            logo: 'https://test.com/logo.png',
            subscribable: false,
        }

        init.init(programMock, dir, options)

        const files = fs.readdirSync(dir)
        assert.strictEqual(files.length, 6)

        assert.strictEqual(files.includes('readme.md'), true)
        assert.strictEqual(files.includes('package.json'), true)
        assert.strictEqual(files.includes('manifest.yml'), true)
        assert.strictEqual(files.includes('.gitignore'), true)
        assert.strictEqual(files.includes('src'), true)
        assert.strictEqual(files.includes('test'), true)

        const srcFiles = fs.readdirSync(path.join(dir, 'src'))
        assert.strictEqual(srcFiles.length, 1)
        assert.strictEqual(srcFiles.includes('index.ts'), true)

        const testFiles = fs.readdirSync(path.join(dir, 'test'))
        assert.strictEqual(testFiles.length, 1)
        assert.strictEqual(testFiles.includes('index.spec.ts'), true)

        const packageJson = fs.readFileSync(
            path.join(dir, 'package.json'),
            'utf-8'
        )

        const parsedPackage = JSON.parse(packageJson)

        assert.deepEqual(parsedPackage, {
            dependencies: { '@mamoru-ai/mamoru-sdk-as': '^0.2.1' },
            description: 'TEST_DESCRIPTION',
            devDependencies: { assemblyscript: '^0.27.1' },
            license: 'Apache-2.0',
            name: 'test-name',
            scripts: {
                build: 'asc src/index.ts --exportRuntime --outFile build/index.wasm -b build/index.wat --sourceMap --optimize --exportRuntime --runtime stub --lib',
            },
            tags: ['test', 'cli'],
            version: '0.0.1',
        })

        const manifest = fs.readFileSync(
            path.join(dir, 'manifest.yml'),
            'utf-8'
        )
        const manifestParsed = yaml.parse(manifest)
        assert.deepEqual(manifestParsed, {
            chain: 'sui',
            description: 'TEST_DESCRIPTION',
            logoUrl: 'https://test.com/logo.png',
            name: 'test-name',
            tags: ['test', 'cli'],
            version: '0.0.1',
            type: 'wasm',
            subscribable: false,
        })
    })
    it('FAIL - Fail if project is already in folder', () => {
        const dir = getTempFolder()
        // console.log(colors.green('Temp Folder: ' + dir))
        const options: InitOptions = {
            type: 'sql',
            name: 'TEST name',
            tags: 'test,cli',
            description: 'TEST_DESCRIPTION',
            chain: 'sui',
            logo: 'https://test.com/logo.png',
            subscribable: false,
        }
        init.init(programMock, dir, options)

        try {
            init.init(programMock, dir, options)
            throw new Error('Test should fail')
        } catch (error) {
            // pass
        }
    })
})
