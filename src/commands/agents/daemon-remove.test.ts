import { describe, it, expect } from '@jest/globals'
import {
    generateFoundedUser,
    generateInitOptions,
    getProgramMock,
    getTempFolder,
} from '../../utils/test-utils'
import init from './init'
import publish from './publish'
import removeDaemon from './daemon-remove'
import nock from 'nock'

const programMock = getProgramMock()

describe('removeDaemon', () => {
    it('OK', async () => {
        const dir = getTempFolder()
        const { privkey } = await generateFoundedUser()
        const options = generateInitOptions()
        await init.init(programMock, dir, options)
        // expect.assertions(1)
        nock('https://mamoru-be-production.mamoru.foundation')
            .post('/graphql')
            .reply(200, {
                data: {
                    listDaemons: {
                        items: ['1'],
                    },
                },
            })
        const r = await publish.publish(programMock, dir, {
            privateKey: privkey,
            rpc: 'http://0.0.0.0:26657',
            parameters: '{}',
        })

        // // await delay(2000)

        const result = await removeDaemon(programMock, r.daemonId as string, {
            privateKey: privkey,
            rpc: 'http://0.0.0.0:26657',
        })

        // expect(result).toBeTruthy()
    }, 20000)
})

function delay(millis: number) {
    return new Promise((resolve) => setTimeout(resolve, millis))
}
