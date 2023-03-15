import assert from 'node:assert'
import { describe, it } from '@jest/globals'
import init, { InitOptions } from './init'
import path from 'node:path'
import fs from 'node:fs'
import colors from 'colors'
import yaml from 'yaml'
import { getProgramMock, getTempFolder } from '../utils/test-utils'

const programMock = getProgramMock()

describe(colors.yellow('init'), () => {
    it('OK - Should create Files - type=sql', () => {
        const dir = getTempFolder()
        console.log(colors.green('Temp Folder: ' + dir))
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

        const files = fs.readdirSync(dir)
        assert.strictEqual(files.length, 5)
        assert.strictEqual(files.includes('README.md'), true)
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
            chain: 'sui',
            description: 'TEST_DESCRIPTION',
            logoUrl: 'https://test.com/logo.png',
            name: 'test-name',
            tags: ['test', 'cli'],
            version: '0.0.1',
            type: 'sql',
            subscribable: false,
        })

        const queries = fs.readFileSync(path.join(dir, 'queries.yml'), 'utf-8')
        const queriesParsed = yaml.parse(queries)
        assert.deepEqual(queriesParsed, {
            queries: [
                {
                    query: 'Select * from EXAMPLE',

                    incidentMessage:
                        'Incident: {{query.name}} - {{query.message}}',
                    severity: 'WARNING',
                },
            ],
        })
    })
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

        assert.strictEqual(files.includes('README.md'), true)
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
