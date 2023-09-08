import { describe, expect, it } from '@jest/globals'
import {
    generateFoundedUser,
    getProgramMock,
    getTempFolder,
    isTruthyStr,
} from '../../utils/test-utils'
import publishPlaybook from './playbook-publish'
import initPlaybook from './playbook-init'
import assert from 'node:assert'
import nock from 'nock'

const programMock = getProgramMock()

describe('playbookPublish', () => {
    it('FAIL - playbook not exist', async () => {
        const dir = getTempFolder()

        try {
            await publishPlaybook.playbookPublish(programMock, dir, {
                privateKey: 'privateKey',
                rpc: 'rpcUrl',
            })
        } catch (error) {
            assert.match(
                error.message,
                /The project path does not exist. Please specify a valid path to your project./
            )
        }
    }, 20000)

    it('FAIL - out of gas', async () => {
        nock('https://mamoru-be-production.mamoru.foundation')
            .post('/graphql')
            .reply(200, {
                data: {
                    listDaemons: {
                        items: ['1'],
                    },
                },
            })
        const dir = getTempFolder()
        await initPlaybook.initPlaybook(programMock, dir, {
            name: 'TEST Playbook',
        })
        const { privkey } = await generateFoundedUser()

        await expect(
            publishPlaybook.playbookPublish(programMock, dir, {
                privateKey: privkey,
                rpc: 'http://0.0.0.0:26657',
                gas: (0).toString(),
            })
        ).rejects.toThrow(
            'TxClient:sendMsgCreatePlaybook: Could not broadcast Tx: Broadcasting transaction failed with code 11 (codespace: sdk). Log: out of gas in location: ReadFlat; gasWanted: 0, gasUsed: 1000: out of gas'
        )
    }, 20000)

    it('PASS - CREATE/UPDATE daemon does not exists', async () => {
        nock('https://mamoru-be-production.mamoru.foundation')
            .post('/graphql')
            .reply(200, {
                data: {
                    listDaemons: {
                        items: ['1'],
                    },
                },
            })
        const dir = getTempFolder()
        await initPlaybook.initPlaybook(programMock, dir, {
            name: 'TEST Playbook',
        })
        const { privkey } = await generateFoundedUser()

        // Create playbook
        const createResult = await publishPlaybook.playbookPublish(
            programMock,
            dir,
            {
                privateKey: privkey,
                rpc: 'http://0.0.0.0:26657',
                gas: (100000).toString(),
            }
        )
        const playbookId = createResult.responsePlaybookId as string
        assert.ok(createResult)
        assert.equal(isTruthyStr(playbookId), true)
        nock('https://mamoru-be-production.mamoru.foundation')
            .post('/graphql')
            .reply(200, {
                data: {
                    listDaemons: {
                        items: ['1'],
                    },
                },
            })
        // Update playbook
        const updateResult = await publishPlaybook.playbookPublish(
            programMock,
            dir,
            {
                privateKey: privkey,
                rpc: 'http://0.0.0.0:26657',
                gas: (100000).toString(),
                playbookId: playbookId,
            }
        )
        assert.ok(updateResult)
        assert.equal(
            isTruthyStr(updateResult.responsePlaybookId as string),
            true
        )
    }, 20000)

    it('FAIL - CREATE daemon does not exists', async () => {
        expect.assertions(1)
        nock('https://mamoru-be-production.mamoru.foundation')
            .post('/graphql')
            .reply(200, {
                data: {
                    listDaemons: {
                        items: [],
                    },
                },
            })
        const dir = getTempFolder()
        await initPlaybook.initPlaybook(programMock, dir, {
            name: 'TEST Playbook',
        })
        const { privkey } = await generateFoundedUser()

        // Create playbook
        const createResult = await publishPlaybook
            .playbookPublish(programMock, dir, {
                privateKey: privkey,
                rpc: 'http://0.0.0.0:26657',
                gas: (100000).toString(),
            })
            .catch((e) => {
                expect(e.message).toMatch(
                    /ome of the Agents specified in the playbook do not exist/
                )
            })
    }, 20000)
})
