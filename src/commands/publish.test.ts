import assert from 'node:assert'
import { describe, it } from '@jest/globals'
import publish from './publish'
import colors from 'colors'
import init from './init'
import build from './build'
import {
    generateInitOptions,
    getProgramMock,
    getTempFolder,
} from '../utils/test'
import { runCommand } from '../utils/utils'

const programMock = getProgramMock()

describe(colors.yellow('publish'), () => {
    it('FAIL - invalid manifest', async () => {
        const dir = getTempFolder()
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const options = generateInitOptions({ type: 'not-valid' })
        init.init(programMock, dir, options)

        try {
            await publish.publish(programMock, dir, {
                privateKey: 'privateKey',
                rpcUrl: 'rpcUrl',
            })
        } catch (error) {
            assert.match(error.message, /manifest contains invalid structure/)
        }
    })
    it('FAIL - invalid privateKey', async () => {
        const dir = getTempFolder()
        const options = generateInitOptions({ type: 'sql' })
        init.init(programMock, dir, options)

        try {
            await publish.publish(programMock, dir, {
                privateKey: 'privateKey',
                rpcUrl: 'rpcUrl',
            })
            throw new Error('Should not reach here')
        } catch (error) {
            assert.match(
                error.message,
                /Invalid string. Length must be a multiple of 4/
            )
        }
    })
    describe(colors.cyan('SQL'), () => {
        /**
         * Commented because it hangs...
         */
        // it('FAIL - invalid rpcUrl', async () => {
        //     const dir = getTempFolder()
        //     const options = generateInitOptions({ type: 'sql' })
        //     init.init(programMock, dir, options)

        //     try {
        //         await publish.publish(programMock, dir, {
        //             privateKey: 'Z5a1pRrwP1yqQxM8Nt7j19i9YSjufjY9n8U0pYDyqeg=',
        //             rpcUrl: 'invalid',
        //         })
        //     } catch (error) {
        //         assert.match(
        //             error.message,
        //             /Invalid string. Length must be a multiple of 4/
        //         )
        //     }
        // })
        it('OK - SOLE', async () => {
            const dir = getTempFolder()
            const options = generateInitOptions({ type: 'sql' })
            init.init(programMock, dir, options)

            await publish.publish(programMock, dir, {
                privateKey: 'Z5a1pRrwP1yqQxM8Nt7j19i9YSjufjY9n8U0pYDyqeg=',
                rpcUrl: 'http://0.0.0.0:26657',
            })
        }, 10000)
        it('OK - SUBSCRIBABLE', async () => {
            const dir = getTempFolder()
            const options = generateInitOptions({
                type: 'sql',
                subscribable: true,
            })
            init.init(programMock, dir, options)

            await publish.publish(programMock, dir, {
                privateKey: 'Z5a1pRrwP1yqQxM8Nt7j19i9YSjufjY9n8U0pYDyqeg=',
                rpcUrl: 'http://0.0.0.0:26657',
            })
        })
    })

    describe(colors.cyan('WASM'), () => {
        it('FAIL - no build ', async () => {
            const dir = getTempFolder()
            const options = generateInitOptions({ type: 'wasm' })
            init.init(programMock, dir, options)

            await publish
                .publish(programMock, dir, {
                    privateKey: 'Z5a1pRrwP1yqQxM8Nt7j19i9YSjufjY9n8U0pYDyqeg=',
                    rpcUrl: 'http://0.0.0.0:26657',
                })
                .then(() => {
                    throw new Error('Should not reach here')
                })
                .catch((error) => {
                    assert.match(
                        error.message,
                        /Project is not compiled, compile it first, use "mamoru-cli build"/
                    )
                })
        })
        it('OK - SOLE', async () => {
            const dir = getTempFolder()
            const options = generateInitOptions({ type: 'wasm' })
            init.init(programMock, dir, options)
            await runCommand('npm install --prefix ' + dir)

            build.build(programMock, dir)
            await publish.publish(programMock, dir, {
                privateKey: 'Z5a1pRrwP1yqQxM8Nt7j19i9YSjufjY9n8U0pYDyqeg=',
                rpcUrl: 'http://0.0.0.0:26657',
            })
        }, 10000)
    })
})
