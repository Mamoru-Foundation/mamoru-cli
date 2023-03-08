import { Command } from 'commander'
import assert from 'node:assert'
import { describe, it } from 'node:test'
import init, { InitOptions } from './init'
import build from './build'
import os from 'node:os'
import path from 'node:path'
import fs from 'node:fs'
import colors from 'colors'
import yaml from 'yaml'
import { OUT_DIR } from '../services/constants'

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

const generateInitOptions = (obj: Partial<InitOptions> = {}): InitOptions => {
    return {
        type: 'sql',
        name: 'TEST name',
        tags: 'test,cli',
        description: 'TEST_DESCRIPTION',
        chain: 'sui',
        logo: 'https://test.com/logo.png',
        ...obj,
    }
}

describe(colors.yellow('build'), () => {
    it('FAIL - should ignore type=sql projects', async () => {
        const dir = getTempFolder()
        console.log(colors.green('Temp Folder: ' + dir))
        const options = generateInitOptions({ type: 'sql' })
        init.init(programMock, dir, options)
        await build
            .build(programMock, dir)
            .then(() => {
                assert.fail('Command "build" should fail for type=sql projects')
            })
            .catch((err) => {
                assert.strictEqual(
                    err.message,
                    'Oops, nothing to build for SQL based daemons.'
                )
            })
    })

    it('OK - should build type=wasm projects', async () => {
        const dir = getTempFolder()
        console.log(colors.green('Temp Folder: ' + dir))
        const options = generateInitOptions({ type: 'wasm' })
        init.init(programMock, dir, options)
        await build.build(programMock, dir)

        const files = fs.readdirSync(dir)
        assert.strictEqual(files.length, 6 + 1) // +1 for the dist folder
        assert.strictEqual(files.includes('README.md'), true)
        const srcDir = path.join(dir, 'src')
        assert.strictEqual(fs.existsSync(srcDir), true)
        const srcFiles = fs.readdirSync(srcDir)
        assert.strictEqual(srcFiles.length, 1)

        const outDir = path.join(dir, OUT_DIR)
        assert.strictEqual(fs.existsSync(outDir), true)
        const outFiles = fs.readdirSync(outDir)
        assert.strictEqual(outFiles.length, 3)
        assert.strictEqual(outFiles.includes('manifest.yml'), true)
        assert.strictEqual(outFiles.includes('index.wasm'), true)
        assert.strictEqual(outFiles.includes('index.wasm.map'), true)
    })
})
