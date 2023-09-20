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

    it.skip('PASS - CREATE/UPDATE daemon does not exists', async () => {
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

    it('FAIL - Invalid daemon ID', async () => {
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
                    /Invalid daemon ID in playbook condition/
                )
            })
    }, 20000)
})
