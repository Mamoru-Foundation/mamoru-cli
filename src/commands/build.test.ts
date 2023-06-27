/* eslint-disable no-console */
import assert from 'node:assert'
import { describe, it } from '@jest/globals'
import init from './init'
import build from './build'
import path from 'node:path'
import fs from 'node:fs'
import colors from 'colors'
import { OUT_DIR } from '../services/constants'
import {
    generateInitOptions,
    getProgramMock,
    getTempFolder,
} from '../utils/test-utils'
import { runCommand } from '../utils/utils'

const programMock = getProgramMock()

describe(colors.yellow('build'), () => {
    it('FAIL - should ignore type=sql projects', async () => {
        const dir = getTempFolder()
        console.log(colors.green('Temp Folder: ' + dir))
        const options = generateInitOptions({ type: 'sql' })
        await init.init(programMock, dir, options)
        await build
            .build(programMock, dir)
            .then(() => {
                assert.fail('Command "build" should fail for type=sql projects')
            })
            .catch((err) => {
                assert.strictEqual(
                    err.message,
                    'Oops, nothing to build for SQL based daemons'
                )
            })
    })

    it('OK - should build type=wasm projects', async () => {
        const dir = getTempFolder()
        console.log(colors.green('Temp Folder: ' + dir))
        const options = generateInitOptions({ type: 'wasm' })
        await init.init(programMock, dir, options)
        await runCommand('npm install --prefix ' + dir)
        await build.build(programMock, dir)

        const files = fs.readdirSync(dir)
        assert.strictEqual(files.length, 6 + 3) // +1 for the dist folder
        assert.strictEqual(files.includes('readme.md'), true)
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
    }, 10000)
    it.todo('OK - should build type=wasm projects, with multiple parameters')
})
