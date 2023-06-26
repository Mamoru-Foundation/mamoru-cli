/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/ban-ts-comment */
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
    isTruthyStr,
} from '../utils/test-utils'
import { runCommand } from '../utils/utils'
import { getAvailableChains } from '../services/utils'

const programMock = getProgramMock()

describe('publish', () => {
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
    describe('SQL', () => {
        // @ts-ignore
        const cases: [Partial<InitOptions>, boolean] = [
            ...getAvailableChains().map((chain) => [
                {
                    type: 'sql',
                    chain,
                },
                true,
            ]),
            ...getAvailableChains().map((chain) => [
                {
                    type: 'sql',
                    subscribable: true,
                    chain,
                },
                false,
            ]),
        ]

        it.each(cases)(
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
                assert.equal(
                    isTruthyStr(r.daemonId as string),
                    wasDaemonCreated
                )
                assert.equal(isTruthyStr(r.daemonMetadataId), true)
            },
            200000
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
        it('FAIL - SOLE - no enough gas', async () => {
            const dir = getTempFolder()
            const options = generateInitOptions({ type: 'wasm' })
            init.init(programMock, dir, options)
            await runCommand('npm install --prefix ' + dir)
            const { privkey } = await generateFoundedUser()

            await build.build(programMock, dir)
            const r = await publish
                .publish(programMock, dir, {
                    privateKey: privkey,
                    rpc: 'http://0.0.0.0:26657',
                    gas: (100).toString(),
                })
                .then(() => {
                    throw new Error('An error should have been thrown')
                })
                .catch((error) => {
                    assert.match(
                        error.message,
                        /TxClient:sendMsgCreateDaemonMetadata/
                    )
                    assert.match(error.message, /out of gas/)
                })
        }, 20000)
        it('OK - SOLE', async () => {
            const dir = getTempFolder()
            const options = generateInitOptions({ type: 'wasm' })
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
            assert.equal(isTruthyStr(r.daemonId as string), true)
            assert.equal(isTruthyStr(r.daemonMetadataId), true)
        }, 20000)
    })
})
