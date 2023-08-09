import { describe, it } from '@jest/globals'
import { getProgramMock, getTempFolder } from '../utils/test-utils'
import publishPlaybook from './playbook-publish'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import assert from 'node:assert'

const programMock = getProgramMock()

describe('playbook publish', () => {
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
})
