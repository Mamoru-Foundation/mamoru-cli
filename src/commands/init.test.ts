import { Command } from 'commander'
import assert from 'node:assert'
import { describe, it } from 'node:test'
import init, { InitOptions } from './init'
import os from 'node:os'
import path from 'node:path'
import fs from 'node:fs'
import colors from 'colors'
import yaml from 'yaml'

const programMock: Command = {
    opts: () => {
        return {
            verbose: 0,
        }
    },
    error: (str: string) => {
        throw new Error(str)
    },
} as unknown as Command

const getTempFolder = (): string => {
    const tmp = os.tmpdir()
    const folderName =
        'mamoru-cli-test-' + Math.random().toString(5).substring(2, 15)
    const folderPath = path.join(tmp, folderName)
    fs.mkdirSync(folderPath)
    return folderPath
}

describe('init', () => {
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
        }

        init.init(programMock, dir, options)

        const files = fs.readdirSync(dir)
        assert.strictEqual(files.length, 4)
        assert.strictEqual(files.includes('README.md'), true)
        assert.strictEqual(files.includes('package.json'), true)
        assert.strictEqual(files.includes('manifest.yml'), true)
        assert.strictEqual(files.includes('queries.yml'), true)

        const packageJson = fs.readFileSync(
            path.join(dir, 'package.json'),
            'utf-8'
        )
        const parsed = JSON.parse(packageJson)

        assert.deepEqual(parsed, {
            description: 'TEST_DESCRIPTION',
            name: 'test-name',
            version: '0.0.1',
            tags: ['test', 'cli'],
            license: 'Apache-2.0',
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
        })

        const queries = fs.readFileSync(path.join(dir, 'queries.yml'), 'utf-8')
        const queriesParsed = yaml.parse(queries)
        assert.deepEqual(queriesParsed, {
            queries: [
                {
                    query: 'Select * from EXAMPLE',
                    incident: {
                        message: 'Incident: {{query.name}} - {{query.message}}',
                        severity: 'warn',
                    },
                },
            ],
        })
    })
    it('OK - Should create Files - type=wasm', () => {
        const dir = getTempFolder()
        console.log(colors.green('Temp Folder: ' + dir))
        const options: InitOptions = {
            type: 'wasm',
            name: 'TEST name',
            tags: 'test,cli',
            description: 'TEST_DESCRIPTION',
            chain: 'sui',
            logo: 'https://test.com/logo.png',
        }

        init.init(programMock, dir, options)

        const files = fs.readdirSync(dir)
        assert.strictEqual(files.length, 5)
        assert.strictEqual(files.includes('README.md'), true)
        assert.strictEqual(files.includes('package.json'), true)
        assert.strictEqual(files.includes('manifest.yml'), true)
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
            description: 'TEST_DESCRIPTION',
            name: 'test-name',
            version: '0.0.1',
            tags: ['test', 'cli'],
            license: 'Apache-2.0',
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
        })
    })
    it('FAIL - Fail if project is already in folder - type=rest', () => {
        const dir = getTempFolder()
        console.log(colors.green('Temp Folder: ' + dir))
        const options: InitOptions = {
            type: 'sql',
            name: 'TEST name',
            tags: 'test,cli',
            description: 'TEST_DESCRIPTION',
            chain: 'sui',
            logo: 'https://test.com/logo.png',
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
