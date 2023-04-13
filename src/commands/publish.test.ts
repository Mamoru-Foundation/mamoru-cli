import assert from 'node:assert'
import { describe, it } from '@jest/globals'
import publish from './publish'
import colors from 'colors'
import init, { InitOptions } from './init'
import build from './build'
import {
    generateFoundedUser,
    generateInitOptions,
    getProgramMock,
    getTempFolder,
    isUUID,
} from '../utils/test-utils'
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
                rpc: 'rpcUrl',
            })
        } catch (error) {
            assert.match(error.message, /manifest contains invalid structure/)
        }
    }, 20000)
    it('FAIL - invalid privateKey', async () => {
        const dir = getTempFolder()
        const options = generateInitOptions({ type: 'sql' })
        init.init(programMock, dir, options)

        try {
            await publish.publish(programMock, dir, {
                privateKey: 'privateKey',
                rpc: 'rpcUrl',
            })
            throw new Error('Should not reach here')
        } catch (error) {
            assert.match(
                error.message,
                /Invalid string. Length must be a multiple of 4/
            )
        }
    }, 20000)
    describe(colors.cyan('SQL'), () => {
        it.each([
            [{ type: 'sql', chain: 'sui' }, true],
            [{ type: 'sql', chain: 'ethereum' }, true],
            [{ type: 'sql', chain: 'bsc' }, true],
            [{ type: 'sql', chain: 'aptos' }, true],
            [{ type: 'sql', subscribable: true, chain: 'sui' }, false],
            [{ type: 'sql', subscribable: true, chain: 'ethereum' }, false],
            [{ type: 'sql', subscribable: true, chain: 'bsc' }, false],
            [{ type: 'sql', subscribable: true, chain: 'aptos' }, false],
        ])(
            `OK - SOLE %s`,
            async (obj, wasDaemonCreated) => {
                const dir = getTempFolder()
                const options = generateInitOptions(obj as InitOptions)
                init.init(programMock, dir, options)
                const { privkey } = await generateFoundedUser()
                const r = await publish.publish(programMock, dir, {
                    privateKey: privkey,
                    rpc: 'http://0.0.0.0:26657',
                })

                assert.ok(r)
                assert.equal(isUUID(r.daemonId as string), wasDaemonCreated)
                assert.equal(isUUID(r.daemonMetadataId), true)
            },
            20000
        )
    })

    describe(colors.cyan('WASM'), () => {
        it('FAIL - no build ', async () => {
            const dir = getTempFolder()
            const options = generateInitOptions({ type: 'wasm' })
            init.init(programMock, dir, options)
            const { privkey } = await generateFoundedUser()
            await publish
                .publish(programMock, dir, {
                    privateKey: privkey,
                    rpc: 'http://0.0.0.0:26657',
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
        }, 20000)
        it('FAIL - SOLE -no enough gas', async () => {
            const dir = getTempFolder()
            const options = generateInitOptions({ type: 'wasm' })
            console.log(colors.green('dir '), dir)
            init.init(programMock, dir, options)
            await runCommand('npm install --prefix ' + dir)
            const { privkey } = await generateFoundedUser()

            await build.build(programMock, dir)
            const r = await publish
                .publish(programMock, dir, {
                    privateKey: privkey,
                    rpc: 'http://0.0.0.0:26657',
                    gas: (500000).toString(),
                })
                .then(() => {
                    throw new Error('An error should have been thrown')
                })
                .catch((error) => {
                    assert.match(
                        error.message,
                        /Error sending "MsgCreateDaemonMetadata"/
                    )
                    assert.match(error.message, /out of gas/)
                })
        }, 20000)
        it('OK - SOLE', async () => {
            const dir = getTempFolder()
            const options = generateInitOptions({ type: 'wasm' })
            console.log(colors.green('dir '), dir)
            init.init(programMock, dir, options)
            await runCommand('npm install --prefix ' + dir)
            const { privkey } = await generateFoundedUser()

            await build.build(programMock, dir)
            const r = await publish.publish(programMock, dir, {
                privateKey: privkey,
                rpc: 'http://0.0.0.0:26657',
                gas: (1000 * 1000 * 100).toString(),
            })
            assert.ok(r)
            assert.equal(isUUID(r.daemonId as string), true)
            assert.equal(isUUID(r.daemonMetadataId), true)
        }, 20000)
    })
})
