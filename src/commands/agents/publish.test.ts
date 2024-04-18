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
} from '../../utils/test-utils'
import { runCommand } from '../../utils/utils'
import axios, { AxiosResponse } from 'axios'
import nock from 'nock'

const programMock = getProgramMock()

describe('publish', () => {
    it('FAIL - invalid manifest', async () => {
        const dir = getTempFolder()
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const options = generateInitOptions({ type: 'not-valid' })
        await init.init(programMock, dir, options)

        try {
            await publish.publish(programMock, dir, {
                privateKey: 'privateKey',
                rpc: 'rpcUrl',
                parameters: '{}',
            })
        } catch (error) {
            assert.match(error.message, /manifest contains invalid structure/)
        }
    }, 20000)
    it('FAIL - invalid privateKey', async () => {
        const dir = getTempFolder()
        const options = generateInitOptions({ type: 'sql' })
        await init.init(programMock, dir, options)

        try {
            await publish.publish(programMock, dir, {
                privateKey: 'privateKey',
                rpc: 'rpcUrl',
                parameters: '{}',
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
        const weelKnownChains = ['SUI_TESTNET', 'SUI_MAINNET']
        // @ts-ignore
        const cases: [Partial<InitOptions>, boolean] = [
            ...weelKnownChains.map((chain) => [
                {
                    type: 'sql',
                    chain,
                },
                true,
            ]),
            ...weelKnownChains.map((chain) => [
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
                nock('https://mamoru-be-production.mamoru.foundation')
                    .post('/graphql')
                    .reply(200, {})
                const dir = getTempFolder()
                const options = generateInitOptions(obj as InitOptions)
                await init.init(programMock, dir, options)
                const { privkey } = await generateFoundedUser()
                const r = await publish.publish(programMock, dir, {
                    privateKey: privkey,
                    rpc: 'http://0.0.0.0:26657',
                    parameters: '{}',
                })

                assert.ok(r)
                assert.equal(
                    isTruthyStr(r.daemonId as string),
                    wasDaemonCreated
                )
                assert.equal(isTruthyStr(r.daemonMetadataId), true)

                const metadata = await fetchMetadata(r.daemonMetadataId)

                assert.equal(metadata.data.daemonMetadata.sdkVersions.length, 1)
            },
            200000
        )
    })

    describe('WASM', () => {
        it('FAIL - no build ', async () => {
            const dir = getTempFolder()
            const options = generateInitOptions({ type: 'wasm' })
            await init.init(programMock, dir, options)
            const { privkey } = await generateFoundedUser()
            await publish
                .publish(programMock, dir, {
                    privateKey: privkey,
                    rpc: 'http://0.0.0.0:26657',
                    parameters: '{}',
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
        it('FAIL - multiple chains, no chain', async () => {
            const dir = getTempFolder()
            const options = generateInitOptions({
                type: 'wasm',
                chain: ['SUI_TESTNET', 'SUI_MAINNET'],
            })
            await init.init(programMock, dir, options)
            await runCommand('npm install --prefix ' + dir)
            const { privkey } = await generateFoundedUser()

            await build.build(programMock, dir)
            const r = await publish
                .publish(programMock, dir, {
                    privateKey: privkey,
                    rpc: 'http://0.0.0.0:26657',
                    parameters: '{}',
                })
                .then(() => {
                    throw new Error('An error should have been thrown')
                })
                .catch((error) => {
                    assert.match(
                        error.message,
                        /This Agent Metadata supports multiple chains/
                    )
                })
        }, 20000)
        it('FAIL - multiple chains, wrong chain', async () => {
            const dir = getTempFolder()
            const options = generateInitOptions({
                type: 'wasm',
                chain: ['SUI_TESTNET', 'SUI_MAINNET'],
            })
            await init.init(programMock, dir, options)
            await runCommand('npm install --prefix ' + dir)
            const { privkey } = await generateFoundedUser()

            await build.build(programMock, dir)
            const r = await publish
                .publish(programMock, dir, {
                    privateKey: privkey,
                    rpc: 'http://0.0.0.0:26657',
                    chain: 'XXX',
                    parameters: '{}',
                })
                .then(() => {
                    throw new Error('An error should have been thrown')
                })
                .catch((error) => {
                    assert.match(
                        error.message,
                        /This Agent Metadata does not support the chain/
                    )
                })
        }, 50000)
        it('OK - multiple chains, chain', async () => {
            nock('https://mamoru-be-production.mamoru.foundation')
                .post('/graphql')
                .reply(200, {})
            const dir = getTempFolder()
            const options = generateInitOptions({
                type: 'wasm',
                chain: ['SUI_TESTNET', 'SUI_MAINNET'],
            })
            await init.init(programMock, dir, options)
            await runCommand('npm install --prefix ' + dir)
            const { privkey } = await generateFoundedUser()

            await build.build(programMock, dir)
            const r = await publish.publish(programMock, dir, {
                privateKey: privkey,
                rpc: 'http://0.0.0.0:26657',
                chain: 'SUI_TESTNET',
                parameters: '{}',
            })
        }, 50000)
        it('OK - SOLE', async () => {
            nock('https://mamoru-be-production.mamoru.foundation')
                .post('/graphql')
                .reply(200, {})
            const dir = getTempFolder()
            const options = generateInitOptions({ type: 'wasm' })
            await init.init(programMock, dir, options)
            await runCommand('npm install --prefix ' + dir)
            const { privkey } = await generateFoundedUser()

            await build.build(programMock, dir)
            const r = await publish.publish(programMock, dir, {
                privateKey: privkey,
                rpc: 'http://0.0.0.0:26657',
                parameters: '{}',
            })
            assert.ok(r)
            assert.equal(isTruthyStr(r.daemonId as string), true)
            assert.equal(isTruthyStr(r.daemonMetadataId), true)

            const metadata = await fetchMetadata(r.daemonMetadataId)
            assert.equal(
                metadata.data.daemonMetadata.daemonMetadataId,
                r.daemonMetadataId
            )
            assert.equal(metadata.data.daemonMetadata.sdkVersions.length, 2)
        }, 50000)
    })
})

async function fetchMetadata(daemonMetadataId: string): Promise<AxiosResponse> {
    return await axios.get(
        `http://localhost:1317/validation-chain/validationchain/daemon_metadata/${daemonMetadataId}`
    )
}
