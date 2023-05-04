import { describe, expect, it } from '@jest/globals'
import colors from 'colors'
import spawn, { SpawnOptions } from './spawn'
import {
    generateFoundedUser,
    generateInitOptions,
    getProgramMock,
    getTempFolder,
} from '../utils/test-utils'
import { randomUUID } from 'crypto'
import init, { InitOptions } from './init'
import publish from './publish'
import { getAvailableChains } from '../services/utils'
const programMock = getProgramMock()

describe(colors.yellow('spawn'), () => {
    const generateSpawnOptions = (
        override: Partial<SpawnOptions> = {}
    ): SpawnOptions => ({
        metadataId: 'metadataId',
        privateKey: 'privKey',
        ...override,
    })
    it('FAIL - metadataId - metadata not found', async () => {
        expect.assertions(1)
        const { privkey } = await generateFoundedUser()
        await spawn(
            programMock,
            generateSpawnOptions({
                metadataId: randomUUID(),
                privateKey: privkey,
            })
        ).catch((err) => {
            expect(err.message).toBe('Metadata not found')
        })
    })
    it('FAIL - metadata is not subscribable', async () => {
        const dir = getTempFolder()
        const obj = {
            type: 'sql',
            subscribable: false,
            chain: getAvailableChains()[0] as any,
            description: 'description',
            logo: 'https://hello.con/logo.png',
            name: 'name',
            tags: 'tag1',
        } as InitOptions
        const options = generateInitOptions(obj)
        init.init(programMock, dir, options)
        const { privkey } = await generateFoundedUser()
        const r = await publish.publish(programMock, dir, {
            privateKey: privkey,
            rpc: 'http://0.0.0.0:26657',
        })

        const promise = spawn(
            programMock,
            generateSpawnOptions({
                metadataId: r.daemonMetadataId,
                privateKey: privkey,
            })
        )

        await expect(promise).rejects.toThrow('Metadata is not subscribable')
    }, 15000)

    it.todo(
        'FAIL - supportedChains have more than 1 element, no chain in command options'
    )
    it.todo(
        'FAIL - supportedChains have more than 1 element, chain in command options is not supported'
    )
    it('OK - supportedChains have 1 element, no chain in command options', async () => {
        const dir = getTempFolder()
        const obj = {
            type: 'sql',
            subscribable: true,
            chain: getAvailableChains()[0] as any,
            description: 'description',
            logo: 'https://hello.con/logo.png',
            name: 'name',
            tags: 'tag1',
        } as InitOptions
        const options = generateInitOptions(obj)
        init.init(programMock, dir, options)
        const { privkey } = await generateFoundedUser()
        const r0 = await publish.publish(programMock, dir, {
            privateKey: privkey,
            rpc: 'http://0.0.0.0:26657',
        })

        const result = await spawn(
            programMock,
            generateSpawnOptions({
                metadataId: r0.daemonMetadataId,
                privateKey: privkey,
            })
        )

        expect(result).toBeDefined()
        expect(result).toHaveProperty('daemonId')
    }, 20000)
    it.todo(
        'OK - supportedChains have 1 element, chain in command options is supported'
    )
})
