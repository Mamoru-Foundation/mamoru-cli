import { describe, expect, it } from '@jest/globals'
import colors from 'colors'
import launch, { LaunchOptions } from './launch'
import {
    generateFoundedUser,
    generateInitOptions,
    getProgramMock,
    getTempFolder,
} from '../../utils/test-utils'
import { randomUUID } from 'crypto'
import init, { InitOptions } from './init'
import publish from './publish'
import nock from 'nock'
const programMock = getProgramMock()

describe('lauch', () => {
    const availableChains = ['SUI_TESTNET']
    const generateSpawnOptions = (
        override: Partial<LaunchOptions> = {}
    ): LaunchOptions => ({
        metadataId: 'metadataId',
        privateKey: 'privKey',
        ...override,
    })
    it.skip('FAIL - metadataId - metadata not found', async () => {
        const { privkey } = await generateFoundedUser()
        nock('https://mamoru-be-production.mamoru.foundation')
            .post('/graphql')
            .times(3)
            .reply(200, {})
        await launch(
            programMock,
            generateSpawnOptions({
                metadataId: randomUUID(),
                privateKey: privkey,
            })
        ).catch((err) => {
            expect(err.message).toBe('Metadata not found')
        })
    }, 10000)
    it('FAIL - metadata is not subscribable', async () => {
        nock('https://mamoru-be-production.mamoru.foundation')
            .post('/graphql')

            .times(5)
            .reply(200, {})

        const dir = getTempFolder()
        const obj: InitOptions = {
            type: 'sql',
            subscribable: false,
            chain: availableChains,
            description: 'description',
            logo: 'https://hello.con/logo.png',
            name: 'name',
            tags: 'tag1',
            skipTelemetry: true,
        }
        const options = generateInitOptions(obj)
        await init.init(programMock, dir, options)
        const { privkey } = await generateFoundedUser()
        const r = await publish.publish(programMock, dir, {
            privateKey: privkey,
            rpc: 'http://0.0.0.0:26657',
            parameters: '{}',
        })

        const promise = launch(
            programMock,
            generateSpawnOptions({
                metadataId: r.daemonMetadataId,
                privateKey: privkey,
                parameters: '{}',
            })
        )

        await expect(promise).rejects.toThrow('Metadata is not subscribable')
    }, 35000)

    it.todo(
        'FAIL - supportedChains have more than 1 element, no chain in command options'
    )
    it.todo(
        'FAIL - supportedChains have more than 1 element, chain in command options is not supported'
    )
    it.skip('OK - supportedChains have 1 element, no chain in command options', async () => {
        nock('https://mamoru-be-production.mamoru.foundation')
            .post('/graphql')
            .reply(200, {})
        const dir = getTempFolder()
        const obj = {
            type: 'sql',
            subscribable: true,
            chain: availableChains,
            description: 'description',
            logo: 'https://hello.con/logo.png',
            name: 'name',
            tags: 'tag1',
        } as InitOptions
        const options = generateInitOptions(obj)
        await init.init(programMock, dir, options)
        const { privkey } = await generateFoundedUser()
        const r0 = await publish.publish(programMock, dir, {
            privateKey: privkey,
            rpc: 'http://0.0.0.0:26657',
        })
        nock('https://mamoru-be-production.mamoru.foundation')
            .post('/graphql')
            .reply(200, {})

        const result = await launch(
            programMock,
            generateSpawnOptions({
                metadataId: r0.daemonMetadataId,
                privateKey: privkey,
                parameters: '{}',
            })
        )

        expect(result).toBeDefined()
        expect(result).toHaveProperty('daemonId')
    }, 20000)
    it.todo(
        'OK - supportedChains have 1 element, chain in command options is supported'
    )
})
