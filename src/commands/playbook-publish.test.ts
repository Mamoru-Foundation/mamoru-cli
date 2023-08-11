import { describe, expect, it, jest } from '@jest/globals'
import { getProgramMock, getTempFolder } from '../utils/test-utils'
import publishPlaybook, { PlaybookPublishOptions } from './playbook-publish'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import assert from 'node:assert'
import fs from 'fs'
import { beforeEach } from 'node:test'

// Mock dependencies and functions
jest.mock('fs')
jest.mock('../services/console')
jest.mock('../services/playbook')
jest.mock('../services/validation-chain')

const programMock = getProgramMock()

describe('playbookPublish', () => {
    const projectPath = '/path/to/project'
    const options: PlaybookPublishOptions = {
        rpc: 'rpc-url',
        privateKey: 'private-key',
        gas: '1000000',
        playbookId: 'playbook-id',
    }

    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('should fail if playbook YAML is invalid', async () => {
        // Mock fs.readFileSync to return invalid YAML content
        (fs.readFileSync as jest.Mock).mockReturnValue('playbookYamlContent')

        // Call the function and expect it to exit with an error
        await expect(
            publishPlaybook.playbookPublish(programMock, projectPath, options)
        ).rejects.toThrow()
    }, 20000)

    it('should fail if playbook YAML file does not exist', async () => {
        // Mock fs.existsSync to return false
        (fs.existsSync as jest.Mock).mockReturnValue(false)

        // Call the function and expect it to exit with an error
        await expect(
            publishPlaybook.playbookPublish(programMock, projectPath, options)
        ).rejects.toThrow()
    }, 20000)

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
